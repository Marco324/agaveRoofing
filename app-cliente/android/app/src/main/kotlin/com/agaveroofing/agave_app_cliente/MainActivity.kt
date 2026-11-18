package com.agaveroofing.agave_app_cliente

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        crearCanalDeNotificaciones()
    }

    /**
     * E08 — Canal "agave_citas" que usa la API al mandar push por FCM
     * (android.notification.channel_id en api/src/services/fcmService.ts).
     */
    private fun crearCanalDeNotificaciones() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val canal = NotificationChannel(
            "agave_citas",
            "Avisos de mi inspección",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Día programado, recordatorio, inspector en camino y reporte listo"
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(canal)
    }
}
