package com.searchfirmcrm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext

class PhoneCallReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "PhoneCallReceiver"
        var reactContext: ReactApplicationContext? = null
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            val phoneNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

            Log.d(TAG, "Phone state changed: $state, Number: $phoneNumber")

            when (state) {
                TelephonyManager.EXTRA_STATE_RINGING -> {
                    // 전화가 울리고 있음
                    phoneNumber?.let { number ->
                        handleIncomingCall(number)
                    }
                }
                TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                    // 통화 중
                    Log.d(TAG, "Call answered")
                }
                TelephonyManager.EXTRA_STATE_IDLE -> {
                    // 통화 종료
                    Log.d(TAG, "Call ended")
                }
            }
        }
    }

    private fun handleIncomingCall(phoneNumber: String) {
        Log.d(TAG, "Incoming call from: $phoneNumber")

        // React Native로 이벤트 전송
        reactContext?.let { context ->
            val params = Arguments.createMap().apply {
                putString("phoneNumber", phoneNumber)
                putString("timestamp", System.currentTimeMillis().toString())
            }

            PhoneStateModule.sendEvent(context, "onIncomingCall", params)
        }
    }
}
