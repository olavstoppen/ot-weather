import dotenv from "dotenv";
import express, { response } from 'express';
import fetch from 'node-fetch'
import * as xml2js from 'xml2js';
import { CountyForecast, CountyForecastInnerLocation, CountyForecastLocation, WeatherData, WeatherDataTime, WeatherResponse, WeatherResponseForecast } from './models/weather.interfaces';


dotenv.config();
const app = express();
const PORT = process.env.PORT;
const APP_SERVER_URL = process.env.APP_SERVER_URL;

app.get('/weather', (req, res) => {

    todaysForecast();

    async function todaysForecast() {
        const promises = [
            api<WeatherData>("https://api.met.no/weatherapi/locationforecast/2.0?lat=58.916212&lon=5.732256"),
            getForecastString()
        ];
        const [data, description] = await Promise.all(promises as any);

        const weatherData: WeatherData = data as WeatherData;
        const weatherDescription: string = description as string;

        res.send(generateWeatherObj(weatherData.properties.timeseries, weatherDescription))

    }

});

//TODO: Rewrite to use api() function further down
//Apparently met.no doesn't have this API in JSON
async function getForecastString(): Promise<string> {
    const response = await fetch(
        'https://api.met.no/weatherapi/textforecast/2.0/?forecast=landoverview', { headers: { 'User-Agent': 'Olavstoppen-Dash edvard.bjorgen@olavstoppen.no' } })
    const data = await response.text();
console.log(data);

    return new Promise<string>(resolve => {
        xml2js.parseString(data, (err, res: CountyForecast) => {
        console.log(res);
        
            const rogaland = res.textforecast.time[0].forecasttype[0].location.find(
                (i) => {
                    const t : CountyForecastInnerLocation = i.$;
                    return t.name === "Rogaland"
                },
            );
            if (rogaland) {

                resolve(rogaland._);
            } else {
                resolve('');
            }
        });

    });

}
/**
 * 
 * @param weatherDataTime 
 * @param weatherDescription 
 * @returns an object that corresponds with the WeatherResponse interface
 */
function generateWeatherObj(weatherDataTime: WeatherDataTime[], weatherDescription : string) {
    const todaysWeather = getAllTimesForToday(weatherDataTime);

    const currentWeather = getCurrentHourWeather(todaysWeather)[0];
    const currentDayName = getWeekDay(new Date(currentWeather.time).getDay());
    const lowestTemp = getLowestTempOfCurrentDay(todaysWeather);
    const highestTemp = getHighestTempOfCurrentDay(todaysWeather);
    const currentTemp = parseFloat(currentWeather.data.instant.details.air_temperature);

    const currentRainfall = currentWeather.data.next_1_hours.details.precipitation_amount;
    const highestRainfall = currentWeather.data.next_1_hours.details.precipitation_amount_max;
    const lowestRainfall = currentWeather.data.next_1_hours.details.precipitation_amount_min;
    const descriptionString = weatherDescription;
    const symbolUrl = getSymbolUrlFromId(currentWeather.data.next_1_hours.summary.symbol_code);

   const forecast = getFutureForecastWeatherResponse(getFutureForecastWeatherData(weatherDataTime));

    const weather: WeatherResponse = {
        today:
        {
            name: currentDayName,
            currentRainfall: currentRainfall,
            minRainfall: lowestRainfall,
            maxRainfall: highestRainfall,
            temp: Math.round(currentTemp),
            lowestTemp: Math.round(lowestTemp),
            highestTemp: Math.round(highestTemp),
            description: descriptionString,
            symbolUrl: symbolUrl,
        },
        forecast: forecast
    }

    return weather;
}
/**
 * 
 * @param symbolCode 
 * @returns a string url for the symbolcode
 */
function getSymbolUrlFromId(symbolCode: string) {
    
    return symbolCode == "" ? "" : APP_SERVER_URL + "/weather-symbols/" + symbolCode + ".svg";
}

/**
 * 
 * @param weather 
 * @returns all the weather data from API in the current day
 */
function getAllTimesForToday(weather: WeatherDataTime[]) {
    const todaysDate = new Date();

    return weather.filter(i => {
        if (isSameDay(todaysDate, new Date(i.time))) {
            return true;
        }
        return false;
    });
}

/*
 * 
 * @param weather 
 * @returns the forecast formatted for OT-dash
 */
function getFutureForecastWeatherResponse(weather: WeatherDataTime[]) {

    let futureWeatherResponseList : WeatherResponseForecast[] = [];
    
    weather.map(i => {
        const nextHours = i.data.next_6_hours ? i.data.next_6_hours : i.data.next_1_hours;
            const forecastTemp = parseFloat(i.data.instant.details.air_temperature);
            const forecastHighestTemp = parseFloat(i.data.instant.details.air_temperature_percentile_90);
            const forecastLowestTemp = parseFloat(i.data.instant.details.air_temperature_percentile_10);
            
        const w : WeatherResponseForecast = {
            temp : Math.round(forecastTemp),
            highestTemp : Math.round(forecastHighestTemp),
            lowestTemp : Math.round(forecastLowestTemp),
            name : getWeekDay(new Date(i.time).getDay()),
            symbolUrl : getSymbolUrlFromId(nextHours.summary.symbol_code)
        }
        futureWeatherResponseList.push(w)
    })
//Slices the list to only return first five
    return futureWeatherResponseList.slice(0,5);
}
/**
 * 
 * @param weather 
 * @returns The forecast data from the API, but filtered out with only one occurence for each day at UTC (servertime) 12:00 except for current day
 */
function getFutureForecastWeatherData(weather: WeatherDataTime[]) {

    const todaysDate = new Date();
    let futureWeatherList :  WeatherDataTime[] = [];
    const hour = 12;

    
//We only want one forecast for each future day, so we have to filter out everything that is not the current day, and we want the forecast for exactly UTC 12:00 each day
        weather.filter(i => {
        //TODO: Seeing in the api, UTC 12:00 seem to be only one present in all of the forecast when going over 3 days, might change later
        if (!isSameDay(todaysDate, new Date(i.time)) && new Date(i.time).getUTCHours() === hour) {
            
            futureWeatherList.push(i)
            return true;
        }
        return false;
    });
    return futureWeatherList;

}
/**
 * 
 * @param weather 
 * @returns returns the weather for the current hour, since the API lists out weather for erach hour on the current day 
 */
function getCurrentHourWeather(weather: WeatherDataTime[]) {
    const todaysDate = new Date();

    return weather.filter(i => {
        if (isWithinTheHour(todaysDate, new Date(i.time))) {
            return true;
        }
        return false
    });
}
/**
 * 
 * @param weather all weather data from api
 * @returns 
 */
function getHighestTempOfCurrentDay(weather: WeatherDataTime[]) {

    const highest = Math.max.apply(Math, weather.map((w) => {
        return parseFloat(w.data.instant.details.air_temperature);
    }));
    return highest;
}

function getLowestTempOfCurrentDay(weather: WeatherDataTime[]) {

    const lowest = Math.min.apply(Math, weather.map((w) => {
        return parseFloat(w.data.instant.details.air_temperature);
    }));
    return lowest;
}
/**
 * 
 * @param d1 
 * @param d2 
 * @returns For comparing to date objcets of they are the same date
 */
function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}
/**
 * 
 * @param d1 
 * @param d2 
 * @returns For comparing hours of a date object
 */
function isWithinTheHour(d1: Date, d2: Date) {
    return d1.getUTCHours() === d2.getUTCHours()
}
/**
 * 
 * @param day 
 * @returns List of days in norwegian taht corresponds with Date.getDay(), which return a number from 0-6 where 0 is index of first day in week, in JS's case its sunday
 */
function getWeekDay(day: number) {
    //getDay() i js sin Date() går fra 0-6 der 0 er søndag.
    const days = [
        'Søndag',
        'Mandag',
        'Tirsdag',
        'Onsdag',
        'Torsdag',
        'Fredag',
        'Lørdag'

    ];
    return days[day];
}
/**
 * 
 * @param url 
 * @returns Takes in a url and a generic type and returns it as json. met.no prefers to receive User-Agent in header, or else they give yoy 429 and 403 all the damn time
 * TODO: send header separately
 * TODO: Make more general so it can be used for retrieving other things, not only json 
 */
async function api<T>(url: string): Promise<T> {
    const response = await fetch(url, { headers: { 'User-Agent': 'Olavstoppen-Dash edvard.bjorgen@olavstoppen.no' } }
    )
    /*if (!response.ok) {
        throw new Error(response.statusText);
    }*/
    return await (response.json() as Promise<T>);


}

app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});