package dev.peterdsp.fc2.platform

import platform.Foundation.NSDate
import platform.Foundation.timeIntervalSince1970

actual fun nowMillis(): Long = (NSDate().timeIntervalSince1970 * 1000.0).toLong()
