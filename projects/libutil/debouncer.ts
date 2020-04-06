export class ConditionalDebouncer<T, R> {
  timeoutHandle_: R|null = null;
  callback_: ((...args: any[])=>any)|null = null;

  constructor(
    private currentValue: T,
    private validationFn: (value: T)=>(string|null),
    private setValueFn: (value: T)=>void,
    private setErrorFn: (error: string|null)=>void,
    private timeoutFunction: (callback: (...args: any[])=>any, ms: number)=>R,
    private timeoutCancelFunction: (r: R)=>void,
    private timeoutTimeMs: number) {}

  setValue(value: T) {
    this.cancel();

    this.callback_ = () => {
      const maybeError = this.validationFn(value);
      if (maybeError) {
        this.setErrorFn(maybeError);
        this.setValueFn(this.currentValue);
      } else {
        this.currentValue = value;
        this.setErrorFn(null);
        this.setValueFn(value);
      }
      this.cancel();
    };

    this.timeoutHandle_ = this.timeoutFunction(this.callback_, this.timeoutTimeMs);
  }

  fireEarly() {
    if (this.callback_) {
      this.callback_();
      this.cancel();
    }
  }

  cancel() {
    if (this.timeoutHandle_) {
      this.timeoutCancelFunction(this.timeoutHandle_);
      this.timeoutHandle_ = null;
      this.callback_ = null;
    }
  }
}
