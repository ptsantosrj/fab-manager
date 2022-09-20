import React, { FunctionComponent, ReactNode } from 'react';
import { GatewayFormProps, AbstractPaymentModal } from '../abstract-payment-modal';
import { ShoppingCart } from '../../../models/payment';
import { PaymentSchedule } from '../../../models/payment-schedule';
import { User } from '../../../models/user';
import { Invoice } from '../../../models/invoice';

import pagseguroLogo from '../../../../../images/pagseguro-logo.png';
import { PagseguroForm } from './pagseguro-form';

interface PagseguroModalProps {
  isOpen: boolean,
  toggleModal: () => void,
  afterSuccess: (result: Invoice|PaymentSchedule) => void,
  onError: (message: string) => void,
  cart: ShoppingCart,
  currentUser: User,
  schedule?: PaymentSchedule,
  customer: User
}

/**
 * This component show a button for redirect user to PagSeguro Checkout
 * in case of checkout redirect
 */
export const PagseguroModal: React.FC<PagseguroModalProps> = ({ isOpen, toggleModal, afterSuccess, onError, cart, currentUser, schedule, customer }) => {
  /**
   * Return the logos, shown in the modal footer.
   */
  const logoFooter = (): ReactNode => {
    return (
      <div className="pagseguro-modal-icons">
        <img src={pagseguroLogo} alt="Checkout PagSeguro" />
      </div>
    );
  };

  /**
   * Integrates the PayzenForm into the parent PaymentModal
   */
  const renderForm: FunctionComponent<GatewayFormProps> = ({ onSubmit, onSuccess, onError, operator, className, formId, cart, customer, paymentSchedule, children }) => {
    return (
      <PagseguroForm onSubmit={onSubmit}
        onSuccess={onSuccess}
        onError={onError}
        customer={customer}
        operator={operator}
        formId={formId}
        cart={cart}
        className={className}
        paymentSchedule={paymentSchedule}>
        {children}
      </PagseguroForm>
    );
  };

  return (
    <AbstractPaymentModal isOpen={isOpen}
      toggleModal={toggleModal}
      logoFooter={logoFooter()}
      formId="pagseguro-form"
      formClassName="pagseguro-form"
      className="pagseguro-modal"
      currentUser={currentUser}
      cart={cart}
      customer={customer}
      afterSuccess={afterSuccess}
      onError={onError}
      schedule={schedule}
      GatewayForm={renderForm} />
  );
};
