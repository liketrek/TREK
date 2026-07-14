# Display Settings

The Display tab (Settings → Display) controls the visual appearance and locale preferences of the app. All changes save immediately to your account and persist across devices.

<!-- TODO: screenshot: appearance settings panel -->

![Display Settings](assets/UsrSettings.png)

## Color mode

Choose between three options:

| Option | Behaviour |
|--------|-----------|
| Light | Always uses the light theme |
| Dark | Always uses the dark theme |
| Auto | Follows your operating system / browser preference |

## Currency

Your **display currency** — the currency you want to *read* amounts in on the Costs tab (totals, the category chart, balances, settle-up). It is presentation only: it never changes what is stored, and two members of the same trip can read it in different currencies and both see correct balances.

| Option | Behaviour |
|--------|-----------|
| **Trip currency** (default) | Each trip is shown in **its own** currency — a Tokyo trip in yen, a Moscow trip in roubles. |
| A specific currency (e.g. `USD`) | **Every** trip is converted into that currency for you, whatever its own currency is. |

165 currencies are available. Conversion uses live rates, so a converted total can shift slightly from day to day while the trip's actual balances stay fixed.

> This is **not** the trip's currency, which is set on the trip itself and is the base its balances are calculated in. The distinction matters — see [Currencies](Currencies).

An administrator can set the instance-wide default for new users in Admin → Default User Settings. Choosing **Trip currency** yourself overrides it.

## Language

Select your preferred language from the button grid (desktop) or dropdown (mobile). The change takes effect immediately without a page reload. See [Languages](Languages) for the full list of supported languages.

## Temperature unit

Affects the weather widget on trip days.

| Option | Display |
|--------|---------|
| °C Celsius | Metric |
| °F Fahrenheit | Imperial |

## Time format

Affects all time displays throughout the app.

| Option | Example |
|--------|---------|
| 24h | 14:30 |
| 12h | 2:30 PM |

## Route calculation

Toggles automatic route calculation between places on the trip map. Set to **On** or **Off**.

## Booking route labels

Shows or hides labels on booking-related route segments on the map. Set to **On** or **Off**.

## Blur booking codes

When enabled, confirmation codes and reference numbers are blurred until you hover or tap. Set to **On** or **Off**.

## See also

- [Currencies](Currencies)
- [Languages](Languages)
- [User-Settings](User-Settings)
