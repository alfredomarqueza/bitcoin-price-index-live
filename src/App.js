import React, { Component } from 'react';
import Header from './components/Header';
import './App.css';
import { Line, Chart } from 'react-chartjs-2';
import moment from 'moment';
import 'moment/locale/es';
import currencies from './supported-currencies.json';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from  "react-datepicker";
import es from 'date-fns/locale/es';
registerLocale('es', es);

class App extends Component {
  constructor(props) {
    super(props)

    // chart.js defaults
    Chart.defaults.global.defaultFontColor = '#000';
    Chart.defaults.global.defaultFontSize = 16;

    let endDate = new Date();
    let startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    this.state = { historicalData: null, currentPrice: null, currency: "USD", culture: "en-US", countdown: 10, startDate: startDate, endDate: endDate };
    this.onCurrencySelect = this.onCurrencySelect.bind(this);
    this.onCultureSelect = this.onCultureSelect.bind(this);

  }

  componentDidMount() {
    this.getHistoricalData();
    this.getCurrentPrice();

    this.interval = setInterval(this.countDownTimer.bind(this), 3000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  countDownTimer() {
    let countdown = this.state.countdown - 3;
    if (countdown == -2) {
      countdown = 10;
      this.getCurrentPrice();

    }
    this.setState({ countdown });

  }

  appendLeadingZeroes(n){
    if(n <= 9){
      return "0" + n;
    }
    return n
  }

  formatDate(date) {

    let formatted_date = date.getFullYear() + "-" + this.appendLeadingZeroes(date.getMonth() + 1) + "-" + this.appendLeadingZeroes(date.getDate());
    return formatted_date;

  }

  endDate_handleChange(date) {
    this.setState({endDate: date}, () => {this.getHistoricalData();});
  }

  startDate_handleChange(date) {
    this.setState({startDate: date}, () => {this.getHistoricalData();});
  }

  getHistoricalData() {
    let startDate = this.formatDate(this.state.startDate);
    let endDate = this.formatDate(this.state.endDate);

    fetch(`https://api.coindesk.com/v1/bpi/historical/close.json?currency=${this.state.currency}&start=${startDate}&end=${endDate}`)
      .then(response => response.json())
      .then(historicalData => this.setState({ historicalData }))
      .catch(e => e)
  }

  getCurrentPrice() {
    fetch(`https://api.coindesk.com/v1/bpi/currentprice/${this.state.currency}.json`)
      .then(response => response.json())
      .then(currentPrice => this.setState({ currentPrice }))
      .catch(e => e)
  }

  chartOptions() {

    return {
      scales: {
        yAxes: [{
          ticks: {

            callback: ((value, index, values) => {
              return new Intl.NumberFormat(this.state.culture, { style: 'currency', currency: this.state.currency }).format(value);
            })//.bind(this)
          }
        }]
      },

      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            var value = data.datasets[0].data[tooltipItem.index];
            return new Intl.NumberFormat(this.state.culture, { style: 'currency', currency: this.state.currency }).format(value);
          }.bind(this)
        }
      }
    }
  }

  formatCurrectPrice() {
    if (this.state.currentPrice != null && this.state.currentPrice.bpi[this.state.currency] != null) {

      const rate_float = this.state.currentPrice.bpi[this.state.currency].rate_float;

      return Intl.NumberFormat(this.state.culture,
        { style: 'currency', currency: this.state.currency })
        .format(rate_float);
    }

  }

  formatChartData() {

    const { bpi } = this.state.historicalData;
    moment.locale(this.state.culture);
    return {
      labels: Object.keys(bpi).map(date => moment(date).format("ll")),
      datasets: [
        {

          label: "Bitcoin",
          fill: true,
          lineTension: 0.1,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: Object.values(bpi)
        }
      ]
    }
  }

  setCurrency(currency) {
    this.setState({ currency }, () => { this.getHistoricalData(); this.getCurrentPrice(); });
  }

  onCurrencySelect(e) {
    this.setCurrency(e.target.value)
  }

  setCulture(culture) {
    this.setState({ culture });
  }

  onCultureSelect(e) {
    this.setCulture(e.target.value)
  }

  render() {
    return (
      <div className="app">
        <Header title="BITCOIN PRICE LIVE" />

        <div className="select-container">
          <span style={{ fontSize: 18, fontFamily: 'Arial Black' }}> Select your currency: </span>
          <select value={this.state.currency} onChange={this.onCurrencySelect}>
            {currencies.map((obj, index) =>
              <option key={`${index}-${obj.country}`} value={obj.currency}> {obj.currency} </option>
            )}
          </select>
          {
            /* this.state.currency !== 'USD' && (<div>
              <a href="#" className="link" onClick={() => this.setCurrency('USD')} style={{color: "black", fontSize: 16, fontFamily: 'Arial Black'}}> [CLICK HERE TO RESET] </a>
            </div>) */
          }
        </div>

        <div className="select-container">
          <span style={{ fontSize: 18, fontFamily: 'Arial Black' }}> Select your culture: </span>
          <select value={this.state.culture} onChange={this.onCultureSelect}>
            <option value="en-US"> United States </option>
            <option value="es"> Spain </option>
          </select>
        </div>

        <div style={{ marginTop: 10 }}>
          {this.state.currentPrice ? (
            <span style={{ fontSize: 18, fontFamily: 'Arial Black' }}>
              Last price: <input type="text" value={this.formatCurrectPrice()} readonly></input> {this.state.countdown}
            </span>
          ) : (<span></span>)}
          <br />
          <span style={{ fontSize: 18, fontFamily: 'Arial Black' }}> Start date: </span>
          <DatePicker
            selected={this.state.startDate}
            onChange={this.startDate_handleChange.bind(this)}
            dateFormat="MMMM d, yyyy"
            locale={this.state.culture}
          />
          <br />
          <span style={{ fontSize: 18, fontFamily: 'Arial Black' }}> End date: </span>
          <DatePicker
            selected={this.state.endDate}
            onChange={this.endDate_handleChange.bind(this)}
            dateFormat="MMMM d, yyyy"
            locale={this.state.culture}
          />
          <br />
          {this.state.historicalData ? (
            <Line options={this.chartOptions()} data={this.formatChartData()} height={250} />
          ) : (<span></span>)}
        </div>
      </div>
    )

    return null
  }
}

export default App;
