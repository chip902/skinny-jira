// @types/cookiejar-without-keyring.d.ts
declare module "cookiejar-without-keyring" {
	import * as Cookies from "tough-cookie";
	export const CookieJar: typeof Cookies.CookieJar;
}
