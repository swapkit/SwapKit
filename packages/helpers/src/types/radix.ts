export type RadixCoreStateResourceDTO = {
  at_ledger_state?: any;
  manager: {
    resource_type: string;
    divisibility: {
      substate_type: string;
      is_locked: boolean;
      value: {
        divisibility: number;
      };
    };
  };
  owner_role?: any;
};
