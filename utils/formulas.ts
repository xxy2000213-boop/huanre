import { SealInputs, SealResults } from '../types';

/**
 * Calculates heat transfer coefficients based on the provided inputs.
 * Implements the empirical correlations for Dry Gas Seals.
 */
export const calculateHeatTransfer = (inputs: SealInputs): SealResults => {
  const {
    d_outer,
    n_rpm,
    rho,
    mu,
    lambda_gas,
    Pr,
    u_axial,
    delta_gap,
    d_hyd,
    B
  } = inputs;

  // 1. Preprocessing
  const omega = 2 * Math.PI * n_rpm / 60.0; // Angular velocity (rad/s)

  // 2. Reynolds Numbers
  
  // Rotational Reynolds Number (Re_rot)
  // Re_rot = (rho * omega * d_outer * d_hyd) / (2 * mu)
  const Re_rot = (rho * omega * d_outer * d_hyd) / (2 * mu);

  // Axial Reynolds Number (Re_ax)
  // Re_ax = (2 * rho * u_axial * delta_gap) / mu
  const Re_ax = (2 * rho * u_axial * delta_gap) / mu;

  // 3. Stationary Ring (Static) Calculation
  
  // Nu_s = 0.023 * B * Re_ax^0.8 * Pr^0.4
  const Nu_s = 0.023 * B * Math.pow(Re_ax, 0.8) * Math.pow(Pr, 0.4);
  
  // H_s = Nu_s * lambda / (2 * delta)
  const H_s = (Nu_s * lambda_gas) / (2 * delta_gap);

  // 4. Dynamic Ring (Rotating) Calculation
  
  // Nu_r = 0.135 * [(0.5 * Re_rot^2 + Re_ax^2) * Pr]^0.33
  const term_in_Nu_r = (0.5 * Math.pow(Re_rot, 2) + Math.pow(Re_ax, 2)) * Pr;
  const Nu_r = 0.135 * Math.pow(term_in_Nu_r, 1.0 / 3.0);
  
  // H_r = Nu_r * lambda / d_hyd
  const H_r = (Nu_r * lambda_gas) / d_hyd;

  return {
    Re_rot,
    Re_ax,
    Nu_s,
    H_s,
    Nu_r,
    H_r
  };
};