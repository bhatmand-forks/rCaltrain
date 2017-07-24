package me.ranmocy.rcaltrain.database;

import android.arch.persistence.room.TypeConverter;

import java.util.Calendar;

import me.ranmocy.rcaltrain.models.DayTime;

public final class Converters {
    @TypeConverter
    public static Calendar longToCalendar(Long value) {
        if (value == null) {
            return null;
        }
        int year = (int) (value / 10000);
        int month = (int) (value / 100 % 100 - 1); // month is 0-based
        int day = (int) (value % 100);
        Calendar calendar = Calendar.getInstance();
        calendar.clear();
        calendar.set(year, month, day);
        return calendar;
    }

    @TypeConverter
    public static Long calendarToLong(Calendar date) {
        if (date == null) return null;
        return date.get(Calendar.YEAR) * 10000L +
                (date.get(Calendar.MONTH) + 1) * 100 +
                date.get(Calendar.DAY_OF_MONTH);
    }

    @TypeConverter
    public static DayTime fromSecondsOfDay(Long value) {
        return value == null ? null : new DayTime(value);
    }

    @TypeConverter
    public static Long dayTimeToSecondsOfDay(DayTime dayTime) {
        return dayTime == null ? null : dayTime.toSecondsSinceMidnight();
    }
}
