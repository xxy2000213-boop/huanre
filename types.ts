export interface SealInputs {
  d_outer: number;    // Outer diameter (m)
  n_rpm: number;      // Speed (r/min)
  rho: number;        // Density (kg/m^3)
  mu: number;         // Dynamic viscosity (Pa*s)
  lambda_gas: number; // Thermal conductivity (W/(m*K))
  Pr: number;         // Prandtl number
  u_axial: number;    // Axial flow velocity (m/s)
  delta_gap: number;  // Gap (m)
  d_hyd: number;      // Hydraulic diameter (m)
  B: number;          // Correction factor
}

export interface SealResults {
  Re_rot: number;
  Re_ax: number;
  Nu_s: number;
  H_s: number;
  Nu_r: number;
  H_r: number;
}
