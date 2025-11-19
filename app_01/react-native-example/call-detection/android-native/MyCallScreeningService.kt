package com.searchfirmcrm.calldetection

import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import androidx.annotation.RequiresApi
import android.util.Log

@RequiresApi(Build.VERSION_CODES.N)
class MyCallScreeningService : CallScreeningService() {

    companion object {
        private const val TAG = "CallScreeningService"
        var onIncomingCall: ((String) -> Unit)? = null
    }

    override fun onScreenCall(callDetails: Call.Details) {
        Log.d(TAG, "onScreenCall triggered")

        // 전화번호 가져오기
        val phoneNumber = callDetails.handle?.schemeSpecificPart

        if (phoneNumber != null) {
            Log.d(TAG, "Incoming call from: $phoneNumber")

            // React Native로 전화번호 전송
            onIncomingCall?.invoke(phoneNumber)
        }

        // 전화를 허용 (스크리닝만 하고 차단하지 않음)
        val response = CallResponse.Builder()
            .setDisallowCall(false)  // 전화 허용
            .setRejectCall(false)    // 거부하지 않음
            .setSkipCallLog(false)   // 통화 기록에 남김
            .setSkipNotification(false)  // 알림 표시
            .build()

        respondToCall(callDetails, response)
    }
}
