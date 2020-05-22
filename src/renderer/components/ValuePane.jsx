import React from 'react';
import './ValuePane.css';

class ValuePane extends React.Component  {
    render() {
        return (
            <div class="ValuePane">
                <div class="Caption ValuePaneItem">
                    <div>
                        {this.props.caption}
                    </div>
                </div>
                <div class="Value ValuePaneItem">
                    <div>
                        {this.props.value}
                    </div>
                </div>
                <div class="Units ValuePaneItem">
                    <div>
                        {this.props.units}
                    </div>
                </div>
              </div>
        );
    }
}

export default ValuePane;
