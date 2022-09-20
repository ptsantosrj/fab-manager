import React, { FormEvent, FunctionComponent, useEffect, useRef, useState } from 'react';
import { GatewayFormProps } from '../abstract-payment-modal';
import PayzenAPI from '../../../api/payzen';
import PagseguroAPI from '../../../api/pagseguro';
import {
  KryptonClient,
  KryptonError, PaymentTransaction,
  ProcessPaymentAnswer
} from '../../../models/payzen';
import { PaymentSchedule } from '../../../models/payment-schedule';
import { Invoice } from '../../../models/invoice';

// we use these two additional parameters to update the card, if provided
interface PayzenFormProps extends GatewayFormProps {
  updateCard?: boolean,
}

/**
 * A form component to collect the credit card details and to create the payment method on Stripe.
 * The form validation button must be created elsewhere, using the attribute form={formId}.
 */
export const PagseguroForm: React.FC<PayzenFormProps> = ({ onSubmit, onSuccess, onError, children, className, paymentSchedule, updateCard = false, cart, customer, formId }) => {
  const PayZenKR = useRef<KryptonClient>(null);
  const [loadingClass, setLoadingClass] = useState<'hidden' | 'loader' | 'loader-overlay'>('loader');

  useEffect(() => {
    PagseguroAPI.createPaymentLink(cart, customer).then(payment => {
      console.log(payment);
      handleFormReady();
    }).catch(error => onError(error));
  }, [cart, paymentSchedule, customer]);

  /**
   * Callback triggered on PayZen successful payments
   * @see https://docs.lyra.com/fr/rest/V4.0/javascript/features/reference.html#kronsubmit
   */
  const onPaid = (event: ProcessPaymentAnswer): boolean => {
    PayzenAPI.checkHash(event.hashAlgorithm, event.hashKey, event.hash, event.rawClientAnswer).then(async (hash) => {
      if (hash.validity) {
        if (updateCard) return onSuccess(null);

        const transaction = event.clientAnswer.transactions[0];
        if (event.clientAnswer.orderStatus === 'PAID') {
          confirmPayment(event, transaction).then((confirmation) => {
            PayZenKR.current.removeForms().then(() => {
              onSuccess(confirmation);
            });
          }).catch(e => onError(e));
        } else {
          const error = `${transaction?.errorMessage}. ${transaction?.detailedErrorMessage || ''}`;
          onError(error || event.clientAnswer.orderStatus);
        }
      }
    });
    return true;
  };

  /**
   * Confirm the payment, depending on the current type of payment (single shot or recurring)
   */
  const confirmPayment = async (event: ProcessPaymentAnswer, transaction: PaymentTransaction): Promise<Invoice|PaymentSchedule> => {
    if (paymentSchedule) {
      return await PayzenAPI.confirmPaymentSchedule(event.clientAnswer.orderDetails.orderId, transaction.uuid, cart);
    } else {
      return await PayzenAPI.confirm(event.clientAnswer.orderDetails.orderId, cart);
    }
  };

  /**
   * Callback triggered when the PayZen form was entirely loaded and displayed
   * @see https://docs.lyra.com/fr/rest/V4.0/javascript/features/reference.html#%C3%89v%C3%A9nements
   */
  const handleFormReady = () => {
    setLoadingClass('hidden');
  };

  /**
   * Callback triggered when the PayZen payment was refused
   * @see https://docs.lyra.com/fr/rest/V4.0/javascript/features/reference.html#kronerror
   */
  const handleError = (answer: KryptonError) => {
    const message = `${answer.errorMessage}. ${answer.detailedErrorMessage ? answer.detailedErrorMessage : ''}`;
    onError(message);
  };

  /**
   * Handle the submission of the form.
   */
  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    event.stopPropagation();
    onSubmit();

    try {
      const { result } = await PayZenKR.current.validateForm();
      if (result === null) {
        await PayzenAPI.checkCart(cart, customer);
        await PayZenKR.current.onSubmit(onPaid);
        await PayZenKR.current.onError(handleError);
        await PayZenKR.current.submit();
      }
    } catch (err) {
      // catch api errors
      onError(err);
    }
  };

  /**
   * Return a loader
   */
  const Loader: FunctionComponent = () => {
    return (
      <div className={`fa-3x ${loadingClass}`}>
        <i className="fas fa-circle-notch fa-spin" />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} id={formId} className={`pagseguro-form ${className || ''}`}>
      <Loader />
      <div className="payzen-container">
        <div id="pagseguroPaymentForm" />
      </div>
      {children}
    </form>
  );
};
