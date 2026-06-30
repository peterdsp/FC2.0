package dev.peterdsp.fc2

import androidx.compose.ui.window.ComposeUIViewController
import platform.UIKit.UIViewController

/**
 * Entry point the SwiftUI host embeds. Builds the shared object graph and
 * hosts the Compose [App] inside a UIViewController.
 */
fun MainViewController(): UIViewController =
    ComposeUIViewController {
        App(iosAppDependencies())
    }
