import React from 'react';
import { StyleSheet, Text, View, Animated, ScrollView } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button } from 'react-native-elements';
import { createStackNavigator } from 'react-navigation';
import moment from 'moment';
import _ from 'lodash';

import { API_KEY } from './utils/WeatherAPIKey';


import t from 'tcomb-form-native'; 

const For = t.form.Form;

const Zip = t.struct({
  zip: t.Integer
});


class Form extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isLoading: true,
      temperature: 0,
      weatherCondition: null,
      error: null,
      zip: null,
      forecast: [],
      location: null
    }
    this.fetchForecast = this.fetchForecast.bind(this);
}
fetchForecast() {
  console.log("Fetching forecast");
  const value = this._form.getValue();
  console.log('value: ', value.zip);
  fetch(`http://api.openweathermap.org/data/2.5/forecast?zip=${value.zip},us&APPID=${API_KEY}`)
    .then(res => res.json())
    .then(json => {
      this.setState({
        forecast: json.list,
        location:json.city,
        isLoading: false
      })
      this.props.navigation.navigate('Forecast', {forecast: json});
    }).catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
        throw error;
      });
}

  render() {
    const { isLoading, weatherCondition, temperature, forecast } = this.state;
    return (
      <View style={styles.container}>
        <For 
          ref={c => this._form = c}
          type={Zip}
          style={styles.inputContainer}
          />
        <Button
          raised
          icon={{name: 'cached'}}
          title='Submit'
          color='white'
          backgroundColor='blue' 
          onPress={this.fetchForecast}/>
      </View>
    )
  }
}

class Forecast extends React.Component {
  constructor(props) {
    super(props)

    this.convertDate = this.convertDate.bind(this);
  }

  convertDate = (date) => {
    return moment(new Date(date)).format("MMMM YYYY");
  }

  convertToF = (temp) => {
    return parseInt((temp * 1.8) - 459.67)
  }

  _groupByDays = data => {
    return (data.reduce((list, item) => {
      const forecastDate = item.dt_txt.substr(0,10);
      list[forecastDate] = list[forecastDate] || [];
      list[forecastDate].push(item);

      return list;
    }, {}));
  };

  _getInfo = (data, temp=[], min=[], max=[], humidity=[], weather=[]) => {
    data.map((item, i) => {
      max.push(item.main.temp_max);
      min.push(item.main.temp_min);
      humidity.push(item.main.humidity);
      temp.push(item.main.temp);
      weather.push(item.weather[0].description);
      key = i;
    });

    const minMax = {
      min: Math.round(Math.min(...min)),
      max: Math.round(Math.max(...max))
    };

    // Gets the day's average temp
    const avgTemp = Math.round(temp.reduce((curr, next) => curr + next) / temp.length);

    return (
        <View key={key}>
          <Text style={styles.temp}>{`Description: ${weather[0]}`}</Text>
          <Text style={styles.temp}>{`Current Temp: ${avgTemp}°C (${this.convertToF(avgTemp)}°F)`} </Text>
          <Text style={styles.temp}>{`High: ${minMax.max}°C (${this.convertToF(minMax.max)}°F)`} </Text>
          <Text style={styles.temp}>{`Low: ${minMax.min}°C (${this.convertToF(minMax.min)}°F)`} </Text>
        </View>
    );
  };



  render() {
    const { navigation } = this.props;
    const itemId = navigation.getParam('forecast', 'NO-Forecast');
    const city = itemId.city.name;
    const forecastObj = Object.values(this._groupByDays(itemId.list));
    const forecastTiles = forecastObj.length > 5 ? forecastObj.slice(0, 5) : forecastObj;
       
  const displayForecast = forecastTiles.map((forecast, i) => {
    return (
      <View key={i}>
      <Text style={styles.forecast}>{moment(new Date(forecast[0].dt_txt.substr(0,10))).format("MMMM DD[,] YYYY")}</Text>
         {this._getInfo(forecast)}
      </View>
    )
  })


   return (
       <ScrollView>
           <Text style={styles.city}>{city}</Text>
            {displayForecast}
       </ScrollView>
   )
  }
}

const App = createStackNavigator({
  Forecast: { screen: Forecast },
  Form: {screen: Form}
},
{
  initialRouteName: 'Form',
});

export default App;





const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 100,
    paddingLeft:10,
    paddingRight:10
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDE4'
  },
  inputContainer: {
   width:500
  },
  loadingText: {
    fontSize: 30
  },
  buttonStyle: {
    color: 'green'
  },
  city: {
    fontSize:26,
    textAlign: 'center',
    marginBottom: 20
  },
  forecast: {
    textAlign:'center',
    marginTop: 25
  },
  temp: {
    textAlign:'center',
  }
});



