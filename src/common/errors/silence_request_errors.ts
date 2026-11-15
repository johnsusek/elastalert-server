import RequestError from './request_error';

export class OptionsInvalidError extends RequestError {
  constructor(error) {
    super('optionsInvalid', 'Silencing: failed because the options send were invalid. Error message below.', 400, error);
  }
}

export class BodyNotSendError extends RequestError {
  constructor() {
    super('bodyNotSend', 'Silencing: failed because no request body was send.', 400);
  }
}
