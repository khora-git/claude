package com.searchfirmcrm.calldetection

import android.Manifest
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.telecom.TelecomManager
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class CallDetectionModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "CallDetectionModule"
        private const val EVENT_PHONE_CALL_INCOMING = "PhoneCallIncoming"
    }

    private val phoneCallReceiver = PhoneCallReceiver()
    private var isListening = false

    init {
        // CallScreeningService 콜백 설정
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            MyCallScreeningService.onIncomingCall = { phoneNumber ->
                sendEvent(phoneNumber)
            }
        }

        // BroadcastReceiver 콜백 설정
        PhoneCallReceiver.onIncomingCall = { phoneNumber ->
            sendEvent(phoneNumber)
        }
    }

    override fun getName(): String {
        return "CallDetectionModule"
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        try {
            val hasPhoneState = ContextCompat.checkSelfPermission(
                reactApplicationContext,
                Manifest.permission.READ_PHONE_STATE
            ) == PackageManager.PERMISSION_GRANTED

            val hasCallLog = ContextCompat.checkSelfPermission(
                reactApplicationContext,
                Manifest.permission.READ_CALL_LOG
            ) == PackageManager.PERMISSION_GRANTED

            val result = Arguments.createMap()
            result.putBoolean("hasPhoneState", hasPhoneState)
            result.putBoolean("hasCallLog", hasCallLog)
            result.putBoolean("allGranted", hasPhoneState && hasCallLog)

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestScreeningRole(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                val roleManager = reactApplicationContext.getSystemService(Context.ROLE_SERVICE) as RoleManager

                if (roleManager.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) {
                    val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING)
                    currentActivity?.startActivityForResult(intent, 1001)
                    promise.resolve(true)
                } else {
                    promise.reject("NOT_AVAILABLE", "Call screening not available on this device")
                }
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        } else {
            promise.reject("API_LEVEL", "CallScreeningService requires Android 10+")
        }
    }

    @ReactMethod
    fun startListening(promise: Promise) {
        try {
            if (!isListening) {
                // Android 9 이하: BroadcastReceiver 등록
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                    val filter = IntentFilter(TelephonyManager.ACTION_PHONE_STATE_CHANGED)
                    reactApplicationContext.registerReceiver(phoneCallReceiver, filter)
                }

                isListening = true
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        try {
            if (isListening) {
                // BroadcastReceiver 해제
                try {
                    reactApplicationContext.unregisterReceiver(phoneCallReceiver)
                } catch (e: Exception) {
                    // 이미 해제된 경우 무시
                }

                isListening = false
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun sendEvent(phoneNumber: String) {
        val params = Arguments.createMap()
        params.putString("phoneNumber", phoneNumber)

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_PHONE_CALL_INCOMING, params)
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        if (isListening) {
            try {
                reactApplicationContext.unregisterReceiver(phoneCallReceiver)
            } catch (e: Exception) {
                // 무시
            }
        }
    }
}
