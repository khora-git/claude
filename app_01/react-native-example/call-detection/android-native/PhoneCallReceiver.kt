package com.searchfirmcrm.calldetection

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log

class PhoneCallReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "PhoneCallReceiver"
        var onIncomingCall: ((String) -> Unit)? = null
        private var lastState = TelephonyManager.CALL_STATE_IDLE
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            return
        }

        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
        Log.d(TAG, "Phone state changed: $state")

        when (state) {
            TelephonyManager.EXTRA_STATE_RINGING -> {
                // 전화가 울리는 중
                val phoneNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

                if (phoneNumber != null && lastState != TelephonyManager.CALL_STATE_RINGING) {
                    Log.d(TAG, "Incoming call from: $phoneNumber")

                    // React Native로 전화번호 전송
                    onIncomingCall?.invoke(phoneNumber)
                }

                lastState = TelephonyManager.CALL_STATE_RINGING
            }

            TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                // 통화 중
                lastState = TelephonyManager.CALL_STATE_OFFHOOK
            }

            TelephonyManager.EXTRA_STATE_IDLE -> {
                // 전화 종료
                lastState = TelephonyManager.CALL_STATE_IDLE
            }
        }
    }
}
