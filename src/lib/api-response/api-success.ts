export class SuccessErrorApiResponse {
  metadata: {
    code: number;
    message: string;
    timeStamp?: string;
  };

  data: {
    message?: string;
    responseData: any;
  };

  constructor({
    metadata = { code: 200, message: "", timeStamp: new Date().toISOString() },
    data = { message: "Data found successfully", responseData: null },
  }: {
    metadata?: { code: number; message: string; timeStamp?: string };
    data?: { message?: string; responseData: any };
  } = {}) {
    this.metadata = metadata;
    this.data = data;
  }
}
