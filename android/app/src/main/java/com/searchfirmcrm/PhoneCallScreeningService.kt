package com.searchfirmcrm

import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import android.util.Log
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Arguments

@RequiresApi(Build.VERSION_CODES.N)
class PhoneCallScreeningService : CallScreeningService() {

    companion object {
        private const val TAG = "CallScreeningService"
    }

    override fun onScreenCall(callDetails: Call.Details) {
        val phoneNumber = callDetails.handle?.schemeSpecificPart
        Log.d(TAG, "Screening call from: $phoneNumber")

        phoneNumber?.let { number ->
            // React Native로 이벤트 전송
            PhoneCallReceiver.reactContext?.let { context ->
                val params = Arguments.createMap().apply {
                    putString("phoneNumber", number)
                    putString("timestamp", System.currentTimeMillis().toString())
                }

                PhoneStateModule.sendEvent(context, "onIncomingCall", params)
            }
        }

        // 모든 전화를 허용 (차단하지 않음)
        val response = CallResponse.Builder()
            .setDisallowCall(false)
            .setRejectCall(false)
            .setSkipCallLog(false)
            .setSkipNotification(false)
            .build()

        respondToCall(callDetails, response)
    }
}
