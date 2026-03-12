from app.config import USE_MOCK_SENSORS

if USE_MOCK_SENSORS:
    from app.sensors.mock import (
        gps_read as gps_read_impl,
        accel_read as accel_read_impl,
        buzzer_buzz as buzzer_buzz_impl,
        buzzer_stop as buzzer_stop_impl,
        buzzer_is_active as buzzer_is_active_impl,
        oled_show as oled_show_impl,
        oled_show_alert as oled_show_alert_impl,
        oled_clear as oled_clear_impl,
        oled_get_status as oled_get_status_impl,
    )
else:
    from app.sensors.gps import read as gps_read_impl
    from app.sensors.accelerometer import read as accel_read_impl
    from app.sensors.buzzer import (
        buzz as buzzer_buzz_impl,
        stop as buzzer_stop_impl,
        is_active as buzzer_is_active_impl,
    )
    from app.sensors.oled import (
        show_status as oled_show_impl,
        show_alert as oled_show_alert_impl,
        clear as oled_clear_impl,
        get_status as oled_get_status_impl,
    )
