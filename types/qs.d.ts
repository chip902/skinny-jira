// @types/qs.d.ts
declare module "qs" {
	import * as qs from "qs";
	export default qs;

	// Add this missing declaration for AxiosHeaderValue
	type AxiosHeaderValue = string | number | boolean | (string[] & { [key: string]: any });
}
