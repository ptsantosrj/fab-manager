import React, { FormEvent, FunctionComponent, useState } from 'react';
import { GatewayFormProps } from '../abstract-payment-modal';
import CheckoutAPI from '../../../api/checkout';
import PagseguroAPI from '../../../api/pagseguro';
import { useTranslation } from 'react-i18next';
import { CreatePaymentLinkResponse } from '../../../models/pagseguro';

// we use these two additional parameters to update the card, if provided
interface PagSeguroFormProps extends GatewayFormProps {
  updateCard?: boolean,
}

/**
 * A form component to collect the credit card details and to create the payment method on Stripe.
 * The form validation button must be created elsewhere, using the attribute form={formId}.
 */
export const PagseguroForm: React.FC<PagSeguroFormProps> = ({ onError, children, className, formId, order, cart, customer }) => {
  const [loadingClass, setLoadingClass] = useState<'hidden' | 'loader' | 'loader-overlay'>('hidden');
  const { t } = useTranslation('shared');

  /**
   * Handle the submission of the form and generate .
   */
  const handleSubmit = async (event: FormEvent): Promise<void> => {
    setLoadingClass('loader');
    event.preventDefault();
    event.stopPropagation();
    if (order) {
      CheckoutAPI.payment(order).then(res => {
        const payment = res.payment as CreatePaymentLinkResponse;
        if (payment.url) {
          window.location.href = payment.url;
        }
      }).catch(error => onError(error))
        .finally(() => setLoadingClass('hidden'));
    } else {
      PagseguroAPI.createPaymentLink(cart, customer).then(payment => {
        if (payment.url) {
          window.location.href = payment.url;
        }
      }).catch(error => onError(error))
        .finally(() => setLoadingClass('hidden'));
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
      <div className="pagseguro-container">
        <div id="pagseguroPaymentForm">
          {t('app.shared.pagseguro_form.warning_redirect')}
        </div>
      </div>
      {children}
    </form>
  );
};
