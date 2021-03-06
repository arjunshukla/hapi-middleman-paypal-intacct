import * as boom from "boom";
import { PluginRegistrationObject } from "hapi";
import { HapiPayPal, IHapiPayPalOptions } from "hapi-paypal";
import { hapiPayPalIntacctInvoicing } from "./invoicing";

export const hapiPayPal = new HapiPayPal();

hapiPayPal.routes.get("paypal_webhooks_listen").custom = async (request, reply, error, response) => {
    if (error) {
        return reply(boom.notFound(error.message));
    }
    try {
        await hapiPayPalIntacctInvoicing.webhookHandler(request.payload);
        return reply("GOT IT!");
    } catch (err) {
        // tslint:disable-next-line:max-line-length
        request.server.log("error", `webhookEvent: ${JSON.stringify(request.payload)} | Error:${err.message}`);
        return reply(boom.badRequest(err.message));
    }
};

export const hapiPayPalOptions: IHapiPayPalOptions = {
    routes: ["paypal_webhooks_listen"],
    sdk: {
        client_id: process.env.PAYPAL_CLIENT_ID,
        client_secret: process.env.PAYPAL_CLIENT_SECRET,
        mode: process.env.PAYPAL_MODE,
        requestOptions: {
          headers: {
              "PayPal-Partner-Attribution-Id": "Hapi-Middleman-Intacct",
          },
        },
    },
    webhook: {
        event_types: [
            {
                name: "INVOICING.INVOICE.PAID",
            },
            {
                name: "INVOICING.INVOICE.CANCELLED",
            },
        ],
        url: `https://${process.env.HOSTNAME}${process.env.PAYPAL_WEBHOOK_ROUTE}`,
    },
};

export const hapiPayPalPlugin: PluginRegistrationObject<any> = {
    options: hapiPayPalOptions,
    register: hapiPayPal.register,
    select: ["public"],
};

export const hapiPayPalGlueRegistration = {
    plugin: hapiPayPalPlugin,
};
