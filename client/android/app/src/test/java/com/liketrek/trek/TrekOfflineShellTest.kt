package com.liketrek.trek

import java.io.File
import java.nio.file.Files
import org.junit.After
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** The stored copy of the server's UI (TrekOfflineShell), on a plain folder. */
class TrekOfflineShellTest {
    private val root: File = Files.createTempDirectory("offline-shell").toFile()

    @After
    fun cleanUp() {
        TrekOfflineShell.deactivate()
        root.deleteRecursively()
    }

    @Test
    fun theCopyAnswersOnlyForTheServerItWasStartedFor() {
        TrekOfflineShell.activate("https://a.example.com")
        assertTrue(TrekOfflineShell.isActive())
        assertTrue(TrekOfflineShell.isActiveFor("https://a.example.com"))
        // Another server picked in the same process: its pages come from the server.
        assertFalse(TrekOfflineShell.isActiveFor("https://b.example.com"))
        assertFalse(TrekOfflineShell.isActiveFor(null))
        // A start that reaches the server leaves the copy behind.
        TrekOfflineShell.deactivate()
        assertFalse(TrekOfflineShell.isActive())
        assertFalse(TrekOfflineShell.isActiveFor("https://a.example.com"))
    }

    @Test
    fun aRefreshCutOffHalfwayKeepsThePreviousBuildWhole() {
        val server = "https://a.example.com"
        val oldPage = "<script src=/assets/index-old.js>".toByteArray()
        assertTrue(TrekOfflineShell.beginRefresh(root, server))
        assertTrue(TrekOfflineShell.saveFile(root, "assets/index-old.js", byteArrayOf(1)))
        assertTrue(TrekOfflineShell.savePage(root, server, oldPage))
        assertTrue(TrekOfflineShell.hasCopy(root, server))

        // The next build: one file arrives, then the connection drops before the page is taken over.
        assertTrue(TrekOfflineShell.beginRefresh(root, server))
        assertTrue(TrekOfflineShell.saveFile(root, "assets/index-new.js", byteArrayOf(2)))

        assertTrue(TrekOfflineShell.hasCopy(root, server))
        assertArrayEquals(oldPage, File(root, "index.html").readBytes())
        assertTrue(TrekOfflineShell.hasFile(root, "assets/index-old.js"))
        // The file already fetched stays for the next try.
        assertTrue(TrekOfflineShell.hasFile(root, "assets/index-new.js"))
    }

    @Test
    fun aCompleteRefreshTakesTheNewPageAndDropsTheOldBuild() {
        val server = "https://a.example.com"
        TrekOfflineShell.beginRefresh(root, server)
        TrekOfflineShell.saveFile(root, "assets/index-old.js", byteArrayOf(1))
        TrekOfflineShell.savePage(root, server, "old".toByteArray())

        TrekOfflineShell.beginRefresh(root, server)
        TrekOfflineShell.saveFile(root, "assets/index-new.js", byteArrayOf(2))
        assertTrue(TrekOfflineShell.savePage(root, server, "new".toByteArray()))
        TrekOfflineShell.prune(root, setOf("assets/index-new.js"))

        assertArrayEquals("new".toByteArray(), File(root, "index.html").readBytes())
        assertTrue(TrekOfflineShell.hasFile(root, "assets/index-new.js"))
        assertFalse(TrekOfflineShell.hasFile(root, "assets/index-old.js"))
    }

    @Test
    fun aRefreshForAnotherServerThrowsTheOldCopyAwayFirst() {
        TrekOfflineShell.beginRefresh(root, "https://a.example.com")
        TrekOfflineShell.saveFile(root, "assets/index-a.js", byteArrayOf(1))
        TrekOfflineShell.savePage(root, "https://a.example.com", "a".toByteArray())

        assertTrue(TrekOfflineShell.beginRefresh(root, "https://b.example.com"))

        assertFalse(TrekOfflineShell.hasCopy(root, "https://a.example.com"))
        assertFalse(TrekOfflineShell.hasCopy(root, "https://b.example.com"))
        assertFalse(TrekOfflineShell.hasFile(root, "assets/index-a.js"))
    }

    @Test
    fun pathsOutsideTheCopyAreRefused() {
        assertFalse(TrekOfflineShell.saveFile(root, "../escape.js", byteArrayOf(1)))
        assertFalse(TrekOfflineShell.saveFile(root, "assets/index.js?v=1", byteArrayOf(1)))
        assertFalse(TrekOfflineShell.hasFile(root, ""))
    }
}
