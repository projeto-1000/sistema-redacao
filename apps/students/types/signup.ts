export interface SignupInitialValues {
  name: string;
  email: string;
  document: string;
  phoneCountryCode: string;
  phone: string;
}

export type SignupContext =
  | {
      source: "ORGANIC";
    }
  | {
      source: "HOTMART_MENTORIA";
      token: string;
      initialValues: SignupInitialValues;
    };
