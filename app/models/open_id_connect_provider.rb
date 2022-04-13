# frozen_string_literal: true

# OpenIdConnectProvider is a special type of AuthProvider which provides authentication through an external SSO server using
# the OpenID Connect protocol.
class OpenIdConnectProvider < ApplicationRecord
  has_one :auth_provider, as: :providable

  validates :issuer, presence: true
  validates :client__identifier, presence: true
  validates :client__secret, presence: true
  validates :client__host, presence: true
  validates :client__scheme, inclusion: { in: %w[http https] }
  validates :client__port, numericality: { only_integer: true, greater_than: 0, less_than: 65_535 }
  validates :response_type, inclusion: { in: %w[code id_token], allow_nil: true }
  validates :response_mode, inclusion: { in: %w[query fragment form_post web_message], allow_nil: true }
  validates :display, inclusion: { in: %w[page popup touch wap], allow_nil: true }
  validates :prompt, inclusion: { in: %w[none login consent select_account], allow_nil: true }
  validates :client_auth_method, inclusion: { in: %w[basic jwks] }

  before_validation :set_post_logout_redirect_uri
  before_validation :set_client_scheme_host_port

  def config
    OpenIdConnectProvider.columns.map(&:name).filter { |n| !n.start_with?('client__') && n != 'profile_url' }.map do |n|
      [n, send(n)]
    end.push(['client_options', client_config]).to_h
  end

  def client_config
    OpenIdConnectProvider.columns.map(&:name).filter { |n| n.start_with?('client__') }.map do |n|
      [n.sub('client__', ''), send(n)]
    end.to_h
  end

  private

  def set_post_logout_redirect_uri
    self.post_logout_redirect_uri = "#{ENV.fetch('DEFAULT_PROTOCOL')}://#{ENV.fetch('DEFAULT_HOST')}/sessions/sign_out"
  end

  def set_client_scheme_host_port
    require 'uri'

    URI.parse(issuer).tap do |uri|
      self.client__scheme = uri.scheme
      self.client__host = uri.host
      self.client__port = uri.port
    end
  end
end
