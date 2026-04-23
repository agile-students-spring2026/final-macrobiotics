import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
    {
        seatAeroAvailabilityId: { type: String, required: true},
        seatAeroTripId: { type: String, required: true, unique: true},
        seatAeroSource: { type: String, default: '' },

        airline: { type: String, default: '' },
        airlineCode: { type: String, default: ''},
        flightNo: { type: String, default: ''},
        depAirport: { type: String, required: true},
        arrAirport: { type: String, required: true},
        dep: { type: String, default: ''},
        arr: { type: String, default: ''},
        durationMin: { type: String, default: 0},
        stops: { type: String, default: 0},
        miles: { type: String, default: 0},
        class: { type: String, default: ''},
        travelDate: { type: String, default: ''},
        source: { type: String, default: ''},

        itinerary: [
            {
                depA: { type: String, default: ''},
                dep: { type: String, default: ''},
                arrA: { type: String, default: ''},
                arr: { type: String, default: ''},
                dur: { type: String, default: ''},
                layover: { type: String, default: ''},
                flightNo: { type: String, default: ''},
                _id: false
            }
        ],

        userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null} 
    },
    {timestamps: true}
);

export default mongoose.model('Bookmark', bookmarkSchema);