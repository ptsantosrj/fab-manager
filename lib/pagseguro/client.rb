# frozen_string_literal: true

# PagSeguro payments gateway
module PagSeguro; end

API_PATH = '/v2/checkout'

# Client for connecting to the PayZen REST API
class PagSeguro::Client
  def initialize(base_url: nil, email: nil, token: nil)
    @base_url = base_url
    @email = email
    @token = token
  end

  protected

  def post(rel_url, payload)
    require 'uri'
    require 'net/http'
    require 'json'

    uri = URI(File.join(base_url, API_PATH, rel_url, authorization_query))
    headers = {
      'Content-Type' => 'text/xml'
    }

    res = Net::HTTP.post(uri, payload.to_xml, headers)
    raise ::PayzenError unless res.is_a?(Net::HTTPSuccess)

    json = JSON.parse(res.body)
    raise ::PayzenError, json['answer'] if json['status'] == 'ERROR'

    json
  end

  def base_url
    @base_url || Setting.get('pagseguro_endpoint')
  end

  def authorization_query
    email = @email || Setting.get('pagseguro_email')
    token = @token || Setting.get('pagseguro_token')

    "?email=#{email}&token=#{token}"
  end
end
