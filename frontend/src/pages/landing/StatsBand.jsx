import React from "react";
import { BandStat } from "./BandStat";

export const StatsBand = () => (
  <section className="py-10">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      <BandStat label="Avg. setup time" value="< 1 week" />
      <BandStat label="Uptime" value="99.9%" />
      <BandStat label="APIs" value="50+" />
      <BandStat label="Integrations" value="20+" />
    </div>
  </section>
);
