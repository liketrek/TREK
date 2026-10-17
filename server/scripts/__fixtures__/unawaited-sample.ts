/**
 * Fixture for `db-call-graph.mjs --unawaited --root scripts/__fixtures__`. Not part of the
 * server build or its typecheck — it exists only so the detector has something small and
 * known-good/known-bad to run against. Three GOOD call shapes should produce no findings;
 * five BAD ones should each produce exactly one, with a distinct reason tag.
 */

class Dep {
  async fetchValue(): Promise<number> {
    return 1;
  }
}

export class Sample {
  private dep: Dep = new Dep();

  async loadOne(): Promise<number> {
    return 1;
  }

  // ---- GOOD (3): correctly consumed, nothing to report ----

  async good1() {
    return await this.loadOne(); // awaited
  }

  async good2() {
    return this.loadOne(); // returned directly — propagates the promise to the caller
  }

  async good3() {
    await Promise.all([this.loadOne(), this.dep.fetchValue()]); // Promise.all combinator
  }

  // ---- BAD (5): used without await, one per reason tag ----

  async bad1() {
    const x = this.loadOne(); // stored-then-used
    return { x };
  }

  async bad2() {
    console.log(this.dep.fetchValue()); // argument
  }

  async bad3() {
    return { value: this.loadOne() }; // property
  }

  async bad4() {
    if (this.loadOne()) {
      return 1;
    }
    return 0; // condition
  }

  async bad5() {
    this.loadOne(); // statement — result discarded
  }
}
