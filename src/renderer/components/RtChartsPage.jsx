import React from 'react';
import ApexChart from 'react-apexcharts';
import './RtChartsPage.css';
import './MeasureParametersComboBox';
import MeasureParametersComboBox from './MeasureParametersComboBox';
import NumberButtonsGroup from './NumberButtonsGroup';
import HorzDivider from './HorzDivider';
import MeasureParameters from '../MeasureParameters';
import EventManager from '../../common/EventManager';
import MainEventManager from '../../common/MainEventManager';

let mainEventManager = MainEventManager.getInstance();

class RtChartsPage extends React.Component {
    constructor(props) {
        super(props);
        this.eventManager = new EventManager();
        this.prefix = 'rt-charts-page-';
        this.measureParameters = new MeasureParameters();
        this.state = {
            selectedMeasureParameterId: this.measureParameters.get('inductorTemperature1').id,
            options: {
              chart: {
                id: "basic-chart"
              },
              xaxis: {
                categories: [1, 2, 3, 4, 5, 6, 7, 8, 9]
              }
            },
            series: [
              {
                name: "series-1",
                data: [30, 40, 45, 50, 49, 60, 70, 91]
              }
            ]
        };
        this.onChartNumberButtonClick = this.onChartNumberButtonClick.bind(this);
    }


    componentDidMount() {
        this.eventManager.subscribe(this.prefix + 'number-button-click', this.onChartNumberButtonClick);
    }


    componentWillUnmount() {
        this.eventManager.unsubscribe(this.prefix + 'number-button-click', this.onChartNumberButtonClick);
    }



    render() {
        let style = 'rt-charts-page ';
        if ( this.props.style ) {
            style += this.props.style;
        }
        let chartCaptionOptions = {
            prefix: this.prefix,
            selectedId: this.state.selectedMeasureParameterId,
            eventManager: this.eventManager
        };
        let chartNumberButtonsGroupOptions = {
            prefix: this.prefix,
            count: this.measureParameters.size(),
            eventManager: this.eventManager
        };

        return  <div class={style}>
                      <MeasureParametersComboBox options={chartCaptionOptions}/>
                      <HorzDivider height="80px" />
                      <ApexChart
                        options={this.state.options}
                        series={this.state.series}
                        type="line"
                        height="300"
                      />
                      <HorzDivider height="20px" />
                      <NumberButtonsGroup options={chartNumberButtonsGroupOptions}/>
                </div>
    }


    onChartNumberButtonClick(event, index) {
        let parameter = this.measureParameters.byIndex(index);
        this.setState({
            selectedMeasureParameterId: parameter.id
        });
    }
}

export default RtChartsPage;
