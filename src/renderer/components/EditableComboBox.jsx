import './EditableComboBox.css';
import React from 'react';
import ComboBoxMixin from './ComboBoxMixin';

class EditableComboBox extends React.Component {
    constructor(props) {
        super(props);
        this.initComboBoxMixin();
    }


    componentDidMount() {
        let width = this.comboboxRef.current.offsetWidth;
        this.selectContainerRef.current.style["width"] = width + "px";
    }


    render() {
        let list = [];
        if ( this.props.items ) {
            let mainClass = "editable-combobox-select-option";
            let checkedClass = mainClass + " editable-combobox-select-option-checked";
            for (let item of this.props.items) {
                list.push(
                  <li class={item.checked ? checkedClass : mainClass}
                    value={item.id}
                    onClick={() => this.onClickItem(item.caption)}>
                      {item.caption}
                  </li>
                );
            }
        }

        return  <div ref={this.comboboxRef} class={"editable-combobox " + this.props.style}>
                    <div class={"editable-combobox-container "}>
                        <input class="editable-combobox-input"
                          value={this.props.value}
                          onChange={this.onChange}
                          onBlur={this.onSubmit}
                          onKeyPress={this.onKeyPressed}/>
                        <div class="editable-combobox-button" onClick={this.onToggle}/>
                    </div>
                    <ul ref={this.selectContainerRef}
                      class="editable-combobox-select-container"
                      onBlur={this.onToggle}>
                        {list}
                    </ul>
                </div>
    }
}


for (let key of Object.getOwnPropertyNames(ComboBoxMixin.prototype)) {
    EditableComboBox.prototype[key] = ComboBoxMixin.prototype[key];
}


export default EditableComboBox;
