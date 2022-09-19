# frozen_string_literal: true

# Provides methods for Order
class Orders::OrderService
  ORDERS_PER_PAGE = 20

  def self.list(filters, current_user)
    orders = Order.where(nil)
    if filters[:user_id]
      statistic_profile_id = current_user.statistic_profile.id
      if (current_user.member? && current_user.id == filters[:user_id].to_i) || current_user.privileged?
        user = User.find(filters[:user_id])
        statistic_profile_id = user.statistic_profile.id
      end
      orders = orders.where(statistic_profile_id: statistic_profile_id)
    elsif current_user.member?
      orders = orders.where(statistic_profile_id: current_user.statistic_profile.id)
    else
      orders = orders.where.not(statistic_profile_id: nil)
    end

    orders = orders.where(reference: filters[:reference]) if filters[:reference].present? && current_user.privileged?

    if filters[:states].present?
      state = filters[:states].split(',')
      orders = orders.where(state: state) unless state.empty?
    end

    if filters[:period_from].present? && filters[:period_to].present?
      orders = orders.where(created_at: DateTime.parse(filters[:period_from])..DateTime.parse(filters[:period_to]).end_of_day)
    end

    orders = orders.where.not(state: 'cart') if current_user.member?
    orders = orders.order(created_at: filters[:sort] || 'DESC')
    total_count = orders.count
    orders = orders.page(filters[:page] || 1).per(ORDERS_PER_PAGE)
    {
      data: orders,
      page: filters[:page] || 1,
      total_pages: orders.page(1).per(ORDERS_PER_PAGE).total_pages,
      page_size: ORDERS_PER_PAGE,
      total_count: total_count
    }
  end

  def self.update_state(order, current_user, state, note = nil)
    return ::Orders::SetInProgressService.new.call(order, current_user) if state == 'in_progress'
    return ::Orders::OrderReadyService.new.call(order, current_user, note) if state == 'ready'
    return ::Orders::OrderCanceledService.new.call(order, current_user) if state == 'canceled'
    return ::Orders::OrderDeliveredService.new.call(order, current_user) if state == 'delivered'
    return ::Orders::OrderRefundedService.new.call(order, current_user) if state == 'refunded'
  end

  def in_stock?(order, stock_type = 'external')
    order.order_items.each do |item|
      return false if item.orderable.stock[stock_type] < item.quantity
    end
    true
  end

  def greater_than_quantity_min?(order)
    order.order_items.each do |item|
      return false if item.quantity < item.orderable.quantity_min
    end
    true
  end

  def item_amount_not_equal?(order)
    order.order_items.each do |item|
      return false if item.amount != item.orderable.amount
    end
    true
  end

  def all_products_is_active?(order)
    order.order_items.each do |item|
      return false unless item.orderable.is_active
    end
    true
  end
end
