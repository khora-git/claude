package com.searchfirmcrm

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class PhoneStateModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "PhoneStateModule"
    }

    @ReactMethod
    fun requestPermissions(promise: Promise) {
        val activity = currentActivity

        if (activity == null) {
            promise.reject("ERROR", "Activity not available")
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val permissions = arrayOf(
                Manifest.permission.READ_PHONE_STATE,
                Manifest.permission.READ_CALL_LOG
            )

            val hasPermissions = permissions.all {
                ContextCompat.checkSelfPermission(activity, it) ==
                    PackageManager.PERMISSION_GRANTED
            }

            if (hasPermissions) {
                promise.resolve(true)
            } else {
                activity.requestPermissions(permissions, 1001)
                promise.resolve(false)
            }
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        val context = reactApplicationContext

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val hasPhoneState = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.READ_PHONE_STATE
            ) == PackageManager.PERMISSION_GRANTED

            val hasCallLog = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.READ_CALL_LOG
            ) == PackageManager.PERMISSION_GRANTED

            val result = Arguments.createMap().apply {
                putBoolean("phoneState", hasPhoneState)
                putBoolean("callLog", hasCallLog)
            }

            promise.resolve(result)
        } else {
            val result = Arguments.createMap().apply {
                putBoolean("phoneState", true)
                putBoolean("callLog", true)
            }
            promise.resolve(result)
        }
    }

    companion object {
        fun sendEvent(reactContext: ReactApplicationContext, eventName: String, params: WritableMap?) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }
}
