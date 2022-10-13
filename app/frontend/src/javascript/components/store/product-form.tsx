import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import slugify from 'slugify';
import _ from 'lodash';
import { HtmlTranslate } from '../base/html-translate';
import { Product } from '../../models/product';
import { FormInput } from '../form/form-input';
import { FormSwitch } from '../form/form-switch';
import { FormSelect } from '../form/form-select';
import { FormChecklist } from '../form/form-checklist';
import { FormRichText } from '../form/form-rich-text';
import { FormFileUpload } from '../form/form-file-upload';
import { FormImageUpload } from '../form/form-image-upload';
import { FabButton } from '../base/fab-button';
import { FabAlert } from '../base/fab-alert';
import ProductCategoryAPI from '../../api/product-category';
import MachineAPI from '../../api/machine';
import ProductAPI from '../../api/product';
import { Plus } from 'phosphor-react';
import { ProductStockForm } from './product-stock-form';
import { CloneProductModal } from './clone-product-modal';
import ProductLib from '../../lib/product';
import { UnsavedFormAlert } from '../form/unsaved-form-alert';
import { UIRouter } from '@uirouter/angularjs';

interface ProductFormProps {
  product: Product,
  title: string,
  onSuccess: (product: Product) => void,
  onError: (message: string) => void,
  uiRouter: UIRouter
}

/**
 * Option format, expected by react-select
 * @see https://github.com/JedWatson/react-select
 */
type selectOption = { value: number, label: string };

/**
 * Option format, expected by checklist
 */
type checklistOption = { value: number, label: string };

/**
 * Form component to create or update a product
 */
export const ProductForm: React.FC<ProductFormProps> = ({ product, title, onSuccess, onError, uiRouter }) => {
  const { t } = useTranslation('admin');

  const { handleSubmit, register, control, formState, setValue, reset } = useForm<Product>({ defaultValues: { ...product } });
  const output = useWatch<Product>({ control });
  const [isActivePrice, setIsActivePrice] = useState<boolean>(product.id && _.isFinite(product.amount));
  const [productCategories, setProductCategories] = useState<selectOption[]>([]);
  const [machines, setMachines] = useState<checklistOption[]>([]);
  const [stockTab, setStockTab] = useState<boolean>(false);
  const [openCloneModal, setOpenCloneModal] = useState<boolean>(false);

  useEffect(() => {
    ProductCategoryAPI.index().then(data => {
      setProductCategories(buildSelectOptions(ProductLib.sortCategories(data)));
    }).catch(onError);
    MachineAPI.index({ disabled: false }).then(data => {
      setMachines(buildChecklistOptions(data));
    }).catch(onError);
  }, []);

  /**
   * Convert the provided array of items to the react-select format
   */
  const buildSelectOptions = (items: Array<{ id?: number, name: string }>): Array<selectOption> => {
    return items.map(t => {
      return { value: t.id, label: t.name };
    });
  };

  /**
   * Convert the provided array of items to the checklist format
   */
  const buildChecklistOptions = (items: Array<{ id?: number, name: string }>): Array<checklistOption> => {
    return items.map(t => {
      return { value: t.id, label: t.name };
    });
  };

  /**
   * Callback triggered when the name has changed.
   */
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const name = event.target.value;
    const slug = slugify(name, { lower: true, strict: true });
    setValue('slug', slug);
  };

  /**
   * Callback triggered when the user toggles the visibility of the product in the store.
   */
  const handleIsActiveChanged = (value: boolean): void => {
    if (value) {
      setValue('is_active_price', true);
      setIsActivePrice(true);
    }
  };

  /**
   * Callback triggered when is active price has changed.
   */
  const toggleIsActivePrice = (value: boolean) => {
    if (!value) {
      setValue('amount', null);
      setValue('is_active', false);
    }
    setIsActivePrice(value);
  };

  /**
   * Callback triggered when the form is submitted: process with the product creation or update.
   */
  const onSubmit: SubmitHandler<Product> = (data: Product) => {
    saveProduct(data);
  };

  /**
   * Call product creation or update api
   */
  const saveProduct = (data: Product) => {
    if (product.id) {
      ProductAPI.update(data).then((res) => {
        reset(res);
        onSuccess(res);
      }).catch(onError);
    } else {
      ProductAPI.create(data).then((res) => {
        reset(res);
        onSuccess(res);
      }).catch(onError);
    }
  };

  /**
   * Toggle clone product modal
   */
  const toggleCloneModal = () => {
    setOpenCloneModal(!openCloneModal);
  };

  /**
   * Add new product file
   */
  const addProductFile = () => {
    setValue('product_files_attributes', output.product_files_attributes.concat({}));
  };

  /**
   * Remove a product file
   */
  const handleRemoveProductFile = (i: number) => {
    return () => {
      const productFile = output.product_files_attributes[i];
      if (!productFile.id) {
        output.product_files_attributes.splice(i, 1);
        setValue('product_files_attributes', output.product_files_attributes);
      }
    };
  };

  /**
   * Add new product image
   */
  const addProductImage = () => {
    setValue('product_images_attributes', output.product_images_attributes.concat({
      is_main: output.product_images_attributes.filter(i => i.is_main).length === 0
    }));
  };

  /**
   * Remove a product image
   */
  const handleRemoveProductImage = (i: number) => {
    return () => {
      const productImage = output.product_images_attributes[i];
      if (!productImage.id) {
        output.product_images_attributes.splice(i, 1);
        if (productImage.is_main) {
          setValue('product_images_attributes', output.product_images_attributes.map((image, k) => {
            if (k === 0) {
              return {
                ...image,
                is_main: true
              };
            }
            return image;
          }));
        } else {
          setValue('product_images_attributes', output.product_images_attributes);
        }
      } else {
        if (productImage.is_main) {
          let mainImage = false;
          setValue('product_images_attributes', output.product_images_attributes.map((image, k) => {
            if (i !== k && !mainImage) {
              mainImage = true;
              return {
                ...image,
                _destroy: i === k,
                is_main: true
              };
            }
            return {
              ...image,
              is_main: i === k ? false : image.is_main,
              _destroy: i === k
            };
          }));
        }
      }
    };
  };

  /**
   * Remove main image in others product images
   */
  const handleSetMainImage = (i: number) => {
    return () => {
      if (output.product_images_attributes.length > 1) {
        setValue('product_images_attributes', output.product_images_attributes.map((image, k) => {
          if (i !== k) {
            return {
              ...image,
              is_main: false
            };
          }
          return {
            ...image,
            is_main: true
          };
        }));
      }
    };
  };

  return (
    <>
      <header>
        <h2>{title}</h2>
        <div className="grpBtn">
          {product.id &&
            <>
              <FabButton className="main-action-btn" onClick={toggleCloneModal}>{t('app.admin.store.product_form.clone')}</FabButton>
              <CloneProductModal isOpen={openCloneModal} toggleModal={toggleCloneModal} product={product} onSuccess={onSuccess} onError={onError} />
            </>
          }
          <FabButton className="main-action-btn" onClick={handleSubmit(saveProduct)}>{t('app.admin.store.product_form.save')}</FabButton>
        </div>
      </header>
      <form className="product-form" onSubmit={handleSubmit(onSubmit)}>
        <UnsavedFormAlert uiRouter={uiRouter} formState={formState} />
        <div className='tabs'>
          <p className={!stockTab ? 'is-active' : ''} onClick={() => setStockTab(false)}>{t('app.admin.store.product_form.product_parameters')}</p>
          <p className={stockTab ? 'is-active' : ''} onClick={() => setStockTab(true)}>{t('app.admin.store.product_form.stock_management')}</p>
        </div>
        {stockTab
          ? <ProductStockForm currentFormValues={output as Product} register={register} control={control} formState={formState} setValue={setValue} onError={onError} onSuccess={onSuccess} />
          : <section>
            <div className="subgrid">
              <FormInput id="name"
                        register={register}
                        rules={{ required: true }}
                        formState={formState}
                        onChange={handleNameChange}
                        label={t('app.admin.store.product_form.name')}
                        className="span-7" />
              <FormInput id="sku"
                        register={register}
                        formState={formState}
                        label={t('app.admin.store.product_form.sku')}
                        className="span-3" />
            </div>
            <div className="subgrid">
              <FormInput id="slug"
                        register={register}
                        rules={{ required: true }}
                        formState={formState}
                        label={t('app.admin.store.product_form.slug')}
                        className='span-7' />
              <FormSwitch control={control}
                          id="is_active"
                          formState={formState}
                          label={t('app.admin.store.product_form.is_show_in_store')}
                          tooltip={t('app.admin.store.product_form.active_price_info')}
                          onChange={handleIsActiveChanged}
                          className='span-3' />
            </div>

            <hr />

            <div className="price-data">
              <div className="header-switch">
                <h4>{t('app.admin.store.product_form.price_and_rule_of_selling_product')}</h4>
                <FormSwitch control={control}
                            id="is_active_price"
                            label={t('app.admin.store.product_form.is_active_price')}
                            defaultValue={isActivePrice}
                            onChange={toggleIsActivePrice} />
              </div>
              {isActivePrice && <div className="price-data-content">
                <FormInput id="amount"
                            type="number"
                            register={register}
                            rules={{ required: isActivePrice, min: 0 }}
                            step={0.01}
                            formState={formState}
                            label={t('app.admin.store.product_form.price')}
                            nullable />
                <FormInput id="quantity_min"
                            type="number"
                            rules={{ required: true }}
                            register={register}
                            formState={formState}
                            label={t('app.admin.store.product_form.quantity_min')} />
              </div>}
            </div>

            <hr />

            <div>
              <h4>{t('app.admin.store.product_form.product_images')}</h4>
              <FabAlert level="warning">
                <HtmlTranslate trKey="app.admin.store.product_form.product_images_info" />
              </FabAlert>
              <div className="product-images">
                <div className="list">
                  {output.product_images_attributes.map((image, i) => (
                    <FormImageUpload key={i}
                                    defaultImage={image}
                                    id={`product_images_attributes[${i}]`}
                                    accept="image/*"
                                    size="small"
                                    register={register}
                                    setValue={setValue}
                                    formState={formState}
                                    className={image._destroy ? 'hidden' : ''}
                                    mainOption={true}
                                    onFileRemove={handleRemoveProductImage(i)}
                                    onFileIsMain={handleSetMainImage(i)}
                                    />
                  ))}
                </div>
              <FabButton
                onClick={addProductImage}
                className='is-secondary'
                icon={<Plus size={24} />}>
                {t('app.admin.store.product_form.add_product_image')}
              </FabButton>
              </div>
            </div>

            <hr />

            <div>
              <h4>{t('app.admin.store.product_form.assigning_category')}</h4>
              <FabAlert level="warning">
                <HtmlTranslate trKey="app.admin.store.product_form.assigning_category_info" />
              </FabAlert>
              <FormSelect options={productCategories}
                          control={control}
                          id="product_category_id"
                          formState={formState}
                          label={t('app.admin.store.product_form.linking_product_to_category')} />
            </div>

            <hr />

            <div>
              <h4>{t('app.admin.store.product_form.assigning_machines')}</h4>
              <FabAlert level="warning">
                <HtmlTranslate trKey="app.admin.store.product_form.assigning_machines_info" />
              </FabAlert>
              <FormChecklist options={machines}
                              control={control}
                              id="machine_ids"
                              formState={formState} />
            </div>

            <hr />

            <div>
              <h4>{t('app.admin.store.product_form.product_description')}</h4>
              <FabAlert level="warning">
                <HtmlTranslate trKey="app.admin.store.product_form.product_description_info" />
              </FabAlert>
              <FormRichText control={control}
                            heading
                            bulletList
                            blockquote
                            link
                            limit={6000}
                            id="description" />
            </div>

            <hr />

            <div>
              <h4>{t('app.admin.store.product_form.product_files')}</h4>
              <FabAlert level="warning">
                <HtmlTranslate trKey="app.admin.store.product_form.product_files_info" />
              </FabAlert>
              <div className="product-documents">
                <div className="list">
                  {output.product_files_attributes.map((file, i) => (
                    <FormFileUpload key={i}
                                    defaultFile={file}
                                    id={`product_files_attributes[${i}]`}
                                    accept="application/pdf"
                                    register={register}
                                    setValue={setValue}
                                    formState={formState}
                                    className={file._destroy ? 'hidden' : ''}
                                    onFileRemove={handleRemoveProductFile(i)}/>
                  ))}
                </div>
                <FabButton
                  onClick={addProductFile}
                  className='is-secondary'
                  icon={<Plus size={24} />}>
                  {t('app.admin.store.product_form.add_product_file')}
                </FabButton>
              </div>
            </div>

            <div className="main-actions">
              <FabButton type="submit" className="main-action-btn">{t('app.admin.store.product_form.save')}</FabButton>
            </div>
          </section>
        }
      </form>
    </>
  );
};
