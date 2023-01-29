# frozen_string_literal: true

require 'stripe/helper'
require 'pay_zen/helper'
require 'pagseguro/helper'

# API Controller for cart checkout
class API::CheckoutController < API::ApiController
  include ::API::OrderConcern
  before_action :authenticate_user!
  before_action :current_order
  before_action :ensure_order

  def payment
    authorize @current_order, policy_class: CheckoutPolicy
    if @current_order.statistic_profile_id.nil? && current_user.privileged?
      user = User.find(params[:customer_id])
      @current_order.statistic_profile = user.statistic_profile
    end
    res = Checkout::PaymentService.new.payment(@current_order, current_user, params[:coupon_code],
                                               params[:payment_id])
    render json: res
  rescue Stripe::StripeError => e
    render json: Stripe::Helper.human_error(e), status: :unprocessable_entity
  rescue PayzenError => e
    render json: PayZen::Helper.human_error(e), status: :unprocessable_entity
  rescue PagseguroError => e
    render json: PagSeguro::Helper.human_error(e), status: :unprocessable_entity
  rescue StandardError => e
    render json: e, status: :unprocessable_entity
  end

  def confirm_payment
    authorize @current_order, policy_class: CheckoutPolicy
    res = Checkout::PaymentService.new.confirm_payment(@current_order, current_user, params[:coupon_code], params[:payment_id])
    render json: res
  rescue StandardError => e
    render json: e, status: :unprocessable_entity
  end
end
