"use strict";
const Persona = use("Persona");
const Driver = require('bigchaindb-driver');
const Bigchain = require('../../Models/Bigchain');
const Config = use("Config");
const driver = require('bigchaindb-driver')

const { validate } = use("Validator");

const API_PATH = 'http://localhost:9984/api/v1/'

class AuthController {


  
  async login({ request, auth, response, session }) {
    const payload = request.only(["uid", "password"]);

    const user = await Persona.verify(payload);

    await auth.login(user);
    response.redirect(Config.get("adonis-auth-scaffold.registrationSuccessRedirectTo"));
  }

  async register({ request, auth, response, session }) {
    const payload = request.only([
      "email",
      "username",
      "password",
      "password_confirmation"
    ]);

    const keys = new Driver.Ed25519Keypair();

    const validation = await validate(
      payload,
      Config.get("adonis-auth-scaffold.validationRules.registration"),
      Config.get("adonis-auth-scaffold.validationMessages")()
    );

    if (validation.fails()) {
      session.withErrors(validation.messages()).flashAll();
      return response.redirect("back");
    }

    const keyObjects = {
      'public_key': keys.publicKey,
      'private_key': keys.privateKey,
    };

    const fields = {...payload, ...keyObjects };

    const user = await Persona.register(fields);

    // optional
    await auth.login(user);
    response.redirect(Config.get("adonis-auth-scaffold.registrationSuccessRedirectTo"));
  }

  async forgotPassword({ request, response, session, auth }) {
    const token = request.input('token');
    const uid = request.input('uid');
    const payload = request.only(['password', 'password_confirmation']);

    if (!token) {
      await Persona.forgotPassword(uid);
      session.flash({ hasMadeResetRequest: 'true' })
      return response.redirect('back')
    }

    try {
      const user = await Persona.updatePasswordByToken(token, payload);
      await auth.login(user);
      return response.redirect(Config.get("adonis-auth-scaffold.registrationSuccessRedirectTo"));
    } catch (error) {
      if (error.name === 'InvalidTokenException') {
        session.flash({ errorMessage: 'The token supplied is not valid.' })
      } else {
        session.flash({ errorMessage: error.message })
      }
    }

    return response.redirect('back')
  }

  getLogin({ request, response, view }) {
    return view.render("auth.login");
  }

  getRegister({ request, response, view }) {
    return view.render("auth.register");
  }

  getResetPassword({ request, response, view, params }) {
    const token = request.input('token');
    return view.render("auth.password-reset", { token });
  }

  async getAuthDashboard({ request, response, view, auth }) {

    return view.render("auth.dashboard");
  }

  getLogout({ response, session }) {
    const loginRoute = Config.get("adonis-auth-scaffold.loginRoute");
    session.clear();

    return response.redirect(loginRoute)
  }
}

module.exports = AuthController;
