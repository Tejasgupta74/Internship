let setFn = null;
export function registerToast(fn){ setFn = fn }
export function toast(msg, type='info'){ if(setFn) setFn({msg,type, id: Date.now()}); else alert(msg) }
