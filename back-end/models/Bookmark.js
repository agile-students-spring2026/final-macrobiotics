import mongoose from 'mongoose';

export const bookmarkSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, trim: true, unique: true},
        airline: { type: String, default: '' },
        airlineCode: { type: String, default: ''},
        flightNo: { type: String, default: ''},
        depAirport: { type: String, required: true},
        arrAirport: { type: String, required: true},
        dep: { type: String, default: ''},
        arr: { type: String, default: ''},
        durationMin: { type: Number, default: 0},
        stops: { type: Number, default: 0},
        miles: { type: Number, default: 0},
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
        ]   
    },
    {timestamps: true}
);

export default mongoose.model('Bookmark', bookmarkSchema);