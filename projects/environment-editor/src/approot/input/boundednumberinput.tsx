import * as React from 'react';
import { TextField } from '@material-ui/core';
import { ConditionalDebouncer } from '@libutil/debouncer';

interface Props {
  value: number,
  label: string,
  minValue: number,
  maxValue: number,
  onUpdate: (value: number) => void,
  debounceTime?: number,
  precision?: number,
  numberType?: 'integer'|'float',
  sign?: 'positive'|'negative'|'any',
}

interface State {
  maybeNewValueString: string,
  errorString: string|null,
}

function getSign(sign?: 'positive'|'negative'|'any'): 'positive'|'negative'|'any' {
  return sign || 'positive';
}

function getNumberType(type?: 'integer'|'float') {
  return type || 'float';
}

function getPrecision(precision?: number) {
  return (precision == null) ? 3 : precision;
}

function getDebounceTime(debounceTime?: number) {
  return (debounceTime == null) ? 1000 : debounceTime;
}

export class BoundedNumberInput extends React.Component<Props, State> {
  state: State = {
    maybeNewValueString: '',
    errorString: null,
  };

  private debouncer: ConditionalDebouncer<string, any>;

  constructor(props: Props) {
    super(props);
    this.state.maybeNewValueString = '' + props.value;
    this.debouncer = new ConditionalDebouncer(
      '' + props.value,
      (value: string) => this.validateInput(this.props, value),
      (value: string) => {
        props.onUpdate(this.parseInput(this.props, value));
        this.setState({...this.state, maybeNewValueString: value,});
      },
      (error: string|null) => {
        this.setState({...this.state, errorString: error,});
      },
      setTimeout.bind(globalThis),
      clearTimeout.bind(globalThis),
      getDebounceTime(props.debounceTime));
  }

  render() {
    return <TextField label={this.props.label}
              helperText={this.state.errorString}
              value={this.state.maybeNewValueString}
              error={this.state.errorString != null}
              onChange={(e) => {
                this.setState({...this.state, maybeNewValueString: e.target.value,});
                this.debouncer.setValue(e.target.value);
              }}></TextField>
  }

  private validateInput = (props: Props, input: string) => {
    const numberType = getNumberType(props.numberType);
    const sign = getSign(props.sign);

    if (+input !== +input) {
      return 'Input is not a number';
    }

    const val = (numberType === 'float') ? parseFloat(input) : parseInt(input);
    if (isNaN(val)) {
      return 'Input is not a number';
    }
    if (sign === 'negative' && val > 0) {
      return 'Input must be negative';
    }
    if (sign === 'positive' && val < 0) {
      return 'Input must be positive';
    }

    return null;
  }

  private parseInput = (props: Props, input: string) => {
    const numberType = getNumberType(props.numberType);
    const sign = getSign(props.sign);
    const val = (numberType === 'float') ? parseFloat(input) : parseInt(input);
    if (isNaN(val) || (sign === 'negative' && val > 0) || (sign === 'positive' && val < 0)) {
      return props.value;
    }

    return +val.toFixed(getPrecision(props.precision));
  };
}
