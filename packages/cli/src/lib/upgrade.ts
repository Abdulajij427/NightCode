import open from 'open';
import {apiClient} from './api-client';


export async function openUpgradeCheckout() {
  const { url } = await apiClient.billing.checkout();
  await open(url);
}

export async function openBillingPortal() {
  const { url } = await apiClient.billing.portal();
  await open(url);
}









// //export async function openUpgradeCheckout() {
//     const billingClient = (apiClient as unknown as {
//         billing: {checkout: {$post: () => Promise<unknown>}};
//     }).billing;


//     const response = await billingClient.checkout.$post() as {
//         ok: boolean;
//         status: number;
//         statusText: string;
//         json: () => Promise<{url: string}>;
//     };

//     if (response.ok) {
//         const data = await response.json();
//         await open(data.url);
//         return;
//     }

//     throw new Error(await getErrorMessage(response));
// //};



// export async function openBillingPortal(){
//    const billingClient = (apiClient as unknown as {
//         billing: {checkout: {$post: () => Promise<unknown>}};
//     }).billing;


//     const response = await billingClient.checkout.$post() as {
//         ok: boolean;
//         status: number;
//         statusText: string;
//         json: () => Promise<{url: string}>;
//     };

//     if (response.ok) {
//         const data = await response.json();
//         await open(data.url);
//         return;
//     }

//     throw new Error(await getErrorMessage(response));
// }


// export async function openUpgradeCheckout(){
//     const response = await apiClient.billing.checkout.$post();

//     if(response.ok){
//         const data = await response.json();
//         await open(data.url);
//         return;
//     }

//     throw new Error(await getErrorMessage(response));
// }