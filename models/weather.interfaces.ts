export interface WeatherData {
    type: string;
    geometry: {
        type: string,
        coordinates: []
    };
    properties: {
        timeseries: WeatherDataTime[]        
    }

}


export interface WeatherDataTime {
    time : string;
    data : {
        instant : {
            details: {
                air_temperature: string;
                air_temperature_percentile_10: string;
                air_temperature_percentile_90: string;

            }
        };
        next_1_hours: {
            summary: {
                symbol_code: "string"
            },
            details : {
                precipitation_amount: string;
                precipitation_amount_max: string;
                precipitation_amount_min: string;

            }

        }
        next_6_hours: {
            summary: {
                symbol_code: "string"
            },
            details : {
                precipitation_amount: string;
                precipitation_amount_max: string;
                precipitation_amount_min: string;

            }

        }
    }
}

export interface CountyForecast {
    textforecast: {
      $: {
        'xmlns:xsi': string;
        'xsi:noNamespaceSchemaLocation': string;
      };
      meta: {
        $: {
          licenseUrl: string;
        };
      }[];
      time: {
        $: {
          from: string;
          to: string;
        };
        forecasttype: [{
          $: {
            name: string;
          };
          location: CountyForecastLocation[];
        }];
      }[];
    };
  }

export interface CountyForecastLocation {
    _: string;
    $: CountyForecastInnerLocation;
}

export interface CountyForecastInnerLocation {
    name: string;
    id: string;
}


export interface WeatherResponse {

    today: {
        name: string;
        currentRainfall: string;
        minRainfall: string;
        maxRainfall: string;
        temp: string;
        lowestTemp: string;
        highestTemp: string;
        description: string;
        symbolUrl: string;
    };
    forecast : WeatherResponseForecast[]
}


export interface WeatherResponseForecast {
    symbolUrl: string;
    highestTemp: string;
    temp: string;
    lowestTemp: string;
    name: string;
}