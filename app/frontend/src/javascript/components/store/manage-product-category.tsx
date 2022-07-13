import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCategory } from '../../models/product-category';
import { FabButton } from '../base/fab-button';
import { FabModal, ModalSize } from '../base/fab-modal';
import { ProductCategoryForm } from './product-category-form';

interface ManageProductCategoryProps {
  action: 'create' | 'update' | 'delete',
  productCategories: Array<ProductCategory>,
  productCategory?: ProductCategory,
  onSuccess: (message: string) => void,
  onError: (message: string) => void,
}

/**
 * This component shows a button.
 * When clicked, we show a modal dialog allowing to fill the parameters of a product category (create new or update existing).
 */
export const ManageProductCategory: React.FC<ManageProductCategoryProps> = ({ productCategories, productCategory, action, onSuccess, onError }) => {
  const { t } = useTranslation('admin');

  // is the modal open?
  const [isOpen, setIsOpen] = useState<boolean>(false);

  /**
  * Opens/closes the product category modal
  */
  const toggleModal = (): void => {
    setIsOpen(!isOpen);
  };

  /**
  * Close the modal if the form submission was successful
  */
  const handleSuccess = (message) => {
    setIsOpen(false);
    onSuccess(message);
  };

  /**
   * Render the appropriate button depending on the action type
   */
  const toggleBtn = () => {
    switch (action) {
      case 'create':
        return (
          <FabButton type='button'
            className="create-button"
            onClick={toggleModal}>
            {t('app.admin.store.manage_product_category.create')}
          </FabButton>
        );
      case 'update':
        return (<FabButton type='button'
          icon={<i className="fas fa-pen" />}
          className="edit-button"
          onClick={toggleModal} />);
      case 'delete':
        return (<FabButton type='button'
          icon={<i className="fa fa-trash" />}
          className="delete-button"
          onClick={toggleModal} />);
    }
  };

  return (
    <div className='manage-product-category'>
      { toggleBtn() }
      <FabModal title={t(`app.admin.store.manage_product_category.${action}`)}
        className="fab-modal-lg"
        width={ModalSize.large}
        isOpen={isOpen}
        toggleModal={toggleModal}
        closeButton>
          { (action === 'update' || action === 'delete') && <p className='subtitle'>{productCategory.name}</p>}
        <ProductCategoryForm action={action}
          productCategories={productCategories}
          productCategory={productCategory}
          onSuccess={handleSuccess} onError={onError} />
      </FabModal>
    </div>
  );
};
