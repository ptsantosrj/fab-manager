class API::PagseguroController < API::PaymentsController

    def test_token
        render json: { token: params['token'], email: params['email'] }, status: :ok
    rescue StandardError => e
        render json: e, status: :unprocessable_entity
    end
end
