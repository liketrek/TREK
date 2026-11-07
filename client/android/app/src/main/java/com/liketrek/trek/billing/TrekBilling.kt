package com.liketrek.trek.billing

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.PluginCall
import com.liketrek.trek.BuildConfig

/**
 * TREK Cloud subscriptions through Google Play Billing, the counterpart of the
 * iOS app's StoreKit 2 (TrekShellPlugin.swift, feature storeKit). The UI drives
 * it through the same TrekShell methods (storeProducts, storePurchase,
 * storeFinish, storeRestore) behind native/iap.ts's IapClient, so the shell's
 * plan screens work unchanged; a purchase's token is the receipt the control
 * plane verifies with Google (iap-google.ts in trek-hosted).
 *
 * Products are subscriptions with the ids `cloud.<plan>.monthly|yearly`, one base
 * plan each. A purchase stays unacknowledged until storeFinish, after the
 * instance exists, so a purchase whose redeem never happened is offered again
 * by a restore rather than lost (Play refunds what is not acknowledged within
 * three days, and the control plane acknowledges too once it has verified).
 */
object TrekBilling {
    private var client: BillingClient? = null
    private var pendingPurchase: PluginCall? = null
    private var pendingProduct: String? = null
    private val waiting = mutableListOf<(Boolean) -> Unit>()
    private var connecting = false

    private val listener = PurchasesUpdatedListener { result, purchases -> onPurchasesUpdated(result, purchases) }

    /**
     * Told of a purchase that went through outside a purchase sheet: a payment
     * that was pending (cash, some carrier billing) and cleared later. The shell
     * redeems it like a restore (the "storeTransaction" event), since Play refunds
     * what is not acknowledged within three days.
     */
    var onTransaction: ((JSObject) -> Unit)? = null

    private fun client(context: Context): BillingClient = client ?: BillingClient.newBuilder(context.applicationContext)
        .setListener(listener)
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().enablePrepaidPlans().build())
        .enableAutoServiceReconnection()
        .build()
        .also { client = it }

    /** Runs [then] once connected; false when Play is not there (no Play Store, a sideloaded device). */
    private fun ready(context: Context, then: (Boolean) -> Unit) {
        val billing = client(context)
        if (billing.isReady) return then(true)
        synchronized(waiting) {
            waiting += then
            if (connecting) return
            connecting = true
        }
        billing.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) = flush(result.responseCode == BillingClient.BillingResponseCode.OK)

            override fun onBillingServiceDisconnected() = flush(false)
        })
    }

    private fun flush(ok: Boolean) {
        val callbacks = synchronized(waiting) {
            connecting = false
            waiting.toList().also { waiting.clear() }
        }
        callbacks.forEach { it(ok) }
    }

    private fun details(context: Context, ids: List<String>, done: (List<ProductDetails>) -> Unit) {
        if (ids.isEmpty()) return done(emptyList())
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(ids.map { QueryProductDetailsParams.Product.newBuilder().setProductId(it).setProductType(BillingClient.ProductType.SUBS).build() })
            .build()
        client(context).queryProductDetailsAsync(params) { result, found ->
            done(if (result.responseCode == BillingClient.BillingResponseCode.OK) found.productDetailsList else emptyList())
        }
    }

    /** The recurring price of a subscription's base plan, as Play formats it for the buyer. */
    internal fun displayPrice(product: ProductDetails): String? {
        val offer = baseOffer(product) ?: return null
        return offer.pricingPhases.pricingPhaseList.lastOrNull()?.formattedPrice
    }

    /** The base plan's own offer: the one without an offer id (free trials and promotions carry one). */
    private fun baseOffer(product: ProductDetails): ProductDetails.SubscriptionOfferDetails? {
        val offers = product.subscriptionOfferDetails ?: return null
        return offers.firstOrNull { it.offerId == null } ?: offers.firstOrNull()
    }

    fun products(context: Context, call: PluginCall) {
        val ids = call.getArray("ids")?.toList<String>().orEmpty()
        ready(context) { ok ->
            val result = JSObject().put("sandbox", BuildConfig.DEBUG)
            if (!ok) return@ready call.resolve(result.put("products", JSArray()))
            details(context, ids) { found ->
                val list = JSArray()
                for (product in found) displayPrice(product)?.let { list.put(JSObject().put("id", product.productId).put("displayPrice", it)) }
                call.resolve(result.put("products", list))
            }
        }
    }

    fun purchase(activity: Activity, call: PluginCall) {
        val id = call.getString("productId") ?: return call.reject("productId is required")
        ready(activity) { ok ->
            if (!ok) return@ready call.resolve(JSObject().put("kind", "failed"))
            details(activity, listOf(id)) { found ->
                val product = found.firstOrNull()
                val offer = product?.let(::baseOffer)
                if (product == null || offer == null) return@details call.resolve(JSObject().put("kind", "failed"))
                pendingPurchase?.resolve(JSObject().put("kind", "cancelled"))
                pendingPurchase = call
                pendingProduct = id
                val params = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(
                        listOf(BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product).setOfferToken(offer.offerToken).build()),
                    )
                    .build()
                activity.runOnUiThread {
                    val launch = client(activity).launchBillingFlow(activity, params)
                    if (launch.responseCode != BillingClient.BillingResponseCode.OK) {
                        settle(if (launch.responseCode == BillingClient.BillingResponseCode.USER_CANCELED) "cancelled" else "failed", null)
                    }
                }
            }
        }
    }

    private fun onPurchasesUpdated(result: BillingResult, purchases: List<Purchase>?) {
        if (pendingPurchase == null) {
            // No sheet waiting: a pending purchase that cleared, or a renewal. Only an
            // undelivered one matters; renewals are acknowledged already.
            if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                undelivered(purchases.orEmpty(), PREFIX)?.let { onTransaction?.invoke(receipt(it)) }
            }
            return
        }
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                val purchase = purchases?.firstOrNull { pendingProduct in it.products } ?: purchases?.firstOrNull()
                when (purchase?.purchaseState) {
                    Purchase.PurchaseState.PURCHASED -> settle("bought", purchase)
                    Purchase.PurchaseState.PENDING -> settle("pending", null)
                    else -> settle("failed", null)
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> settle("cancelled", null)
            // Already subscribed on this Google account (a reinstall, another phone, a
            // redeem that never happened): that subscription is the purchase, and the
            // shell redeems it as it would a new one.
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> settleOwned()
            else -> settle("failed", null)
        }
    }

    private fun settleOwned() {
        val call = pendingPurchase ?: return
        val params = QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build()
        client?.queryPurchasesAsync(params) { result, purchases ->
            val owned = if (result.responseCode == BillingClient.BillingResponseCode.OK) newest(purchases, PREFIX) else null
            if (pendingPurchase !== call) return@queryPurchasesAsync
            settle(if (owned != null) "bought" else "failed", owned)
        } ?: settle("failed", null)
    }

    private fun receipt(purchase: Purchase): JSObject = JSObject()
        .put("purchaseToken", purchase.purchaseToken)
        .put("transactionId", purchase.purchaseToken)
        .put("productId", purchase.products.firstOrNull { it.startsWith(PREFIX) } ?: purchase.products.firstOrNull())

    private fun settle(kind: String, purchase: Purchase?) {
        val call = pendingPurchase ?: return
        pendingPurchase = null
        val product = pendingProduct
        pendingProduct = null
        val out = JSObject().put("kind", kind)
        if (purchase != null) {
            out.put("purchaseToken", purchase.purchaseToken)
            out.put("transactionId", purchase.purchaseToken)
            out.put("productId", purchase.products.firstOrNull() ?: product)
            purchase.orderId?.let { out.put("orderId", it) }
        }
        call.resolve(out)
    }

    /** Marks the purchase delivered, once its instance exists: acknowledged with Play. */
    fun finish(context: Context, call: PluginCall) {
        val token = call.getString("transactionId") ?: return call.reject("transactionId is required")
        ready(context) { ok ->
            if (!ok) return@ready call.resolve()
            val params = AcknowledgePurchaseParams.newBuilder().setPurchaseToken(token).build()
            client(context).acknowledgePurchase(params) { call.resolve() }
        }
    }

    /** The newest active subscription under `prefix` on this Google account, if any. */
    fun restore(context: Context, call: PluginCall) {
        val prefix = call.getString("prefix") ?: "cloud."
        ready(context) { ok ->
            if (!ok) return@ready call.resolve(JSObject())
            val params = QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build()
            client(context).queryPurchasesAsync(params) { result, purchases ->
                val found = if (result.responseCode == BillingClient.BillingResponseCode.OK) newest(purchases, prefix) else null
                if (found == null) return@queryPurchasesAsync call.resolve(JSObject())
                call.resolve(
                    JSObject()
                        .put("purchaseToken", found.purchaseToken)
                        .put("transactionId", found.purchaseToken)
                        .put("productId", found.products.first { it.startsWith(prefix) }),
                )
            }
        }
    }

    /**
     * A paid cloud purchase that was never delivered (not acknowledged), for the
     * shell to redeem at its start: one that cleared while the app was closed.
     */
    fun unfinished(context: Context, call: PluginCall) {
        val prefix = call.getString("prefix") ?: PREFIX
        ready(context) { ok ->
            if (!ok) return@ready call.resolve(JSObject())
            val params = QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build()
            client(context).queryPurchasesAsync(params) { result, purchases ->
                val found = if (result.responseCode == BillingClient.BillingResponseCode.OK) undelivered(purchases, prefix) else null
                call.resolve(found?.let(::receipt) ?: JSObject())
            }
        }
    }

    internal fun undelivered(purchases: List<Purchase>, prefix: String): Purchase? =
        newest(purchases.filter { !it.isAcknowledged }, prefix)

    private const val PREFIX = "cloud."

    internal fun newest(purchases: List<Purchase>, prefix: String): Purchase? = purchases
        .filter { p -> p.purchaseState == Purchase.PurchaseState.PURCHASED && p.products.any { it.startsWith(prefix) } }
        .maxByOrNull { it.purchaseTime }
}
