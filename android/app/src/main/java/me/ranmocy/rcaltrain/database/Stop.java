package me.ranmocy.rcaltrain.database;

import android.arch.persistence.room.ColumnInfo;
import android.arch.persistence.room.Entity;
import android.arch.persistence.room.ForeignKey;
import android.arch.persistence.room.PrimaryKey;

import me.ranmocy.rcaltrain.models.DayTime;

@Entity(tableName = "stops", foreignKeys = {
        @ForeignKey(entity = Trip.class, parentColumns = "id", childColumns = "trip_id", onDelete = ForeignKey.CASCADE),
        @ForeignKey(entity = Station.class, parentColumns = "id", childColumns = "station_id", onDelete = ForeignKey.CASCADE)
})
public final class Stop {

    public Stop(String tripId, int sequence, int stationId, DayTime time) {
        this.tripId = tripId;
        this.sequence = sequence;
        this.stationId = stationId;
        this.time = time;
    }

    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    public int id;

    @ColumnInfo(name = "trip_id", index = true)
    public String tripId;

    @ColumnInfo(name = "sequence")
    public int sequence;

    @ColumnInfo(name = "station_id", index = true)
    public int stationId;

    @ColumnInfo(name = "time")
    public DayTime time;
}