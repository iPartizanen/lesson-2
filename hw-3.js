class TimersManager {
  constructor() {
    this.timers = [];
    this.allStarted = false;
    this.logData = [];
  }

   // Метод _log, который будет записывать в массив логов результат выполнения колбек функции таймера.
  _log(descriptor, out, error) {
    const logObj = {
      name: descriptor.name, // Timer name
      in: descriptor.callbackParams, // Timer job arguments
      out: out, // Timer job result
      created: new Date // Log time
    };
    // Если ошибка произошла, необходимо в лог добавить информацию об этой ошибке.
    if (error) { 
      logObj.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };
    this.logData.push(logObj);
  }

  // Метод print, который будет возвращать массив всех логов.
  print() {
    return this.logData;
  }

  // Find timer by name and return index, or -1 if not found
  _findTimerIndex(timerName) {
    // TimeManager должен вызывать ошибку если поле name содержит неверный тип, отсутствует или пустая строка.
    if (typeof timerName !== 'string' || !timerName) { throw new TypeError('Timer name must be string type!') };
    return this.timers.findIndex((descriptor) => descriptor.name === timerName);
  }

  // Start timer 
  _startTimer(descriptor) {
    let newTimerId = null;
    const { timerId, delay, interval, job, callbackParams } = descriptor;
    if (!timerId) {
      // Необходимо реализовать обработку ошибок возникающих внутри callback функций.
      const safeJob = () => {
        let result = null;
        try {
          result = job(...callbackParams);
          this._log(descriptor, result);
        } catch(error) {
          this._log(descriptor, result, error);
        }  
      }
      if (interval) {
        newTimerId = setInterval(safeJob, delay);
      } else {
        newTimerId = setTimeout(safeJob, delay);
      };
    };  
    return newTimerId;   
  }

  // Stop timer 
  _stopTimer(descriptor) {  
    const { timerId, interval } = descriptor;
    if (timerId) {
      if (interval) {
        clearInterval(timerId);
      } else {
        clearTimeout(timerId);
      };
    };    
  }

  // 1. Метод add должен добавлять таймер в очередь на выполнение. В качестве первого
  // параметра этот метод принимает объект описывающий таймер, а все последующие
  // параметры передаются как аргументы для callback функции таймера.
  add(descriptor, ...callbackParams) {

    // TimeManager должен вызывать ошибку если запустить метод add после старта.
    if (this.allStarted) { throw new Error('Can not add new timer after start!') };
    
    // TimeManager должен вызывать ошибку если попытаться добавить таймер с именем котрое уже было добавлено.
    // (там же валидируется name)
    if (this._findTimerIndex(descriptor.name) >= 0) { throw new Error(`Timer "${descriptor.name}" already exists!`) };

    // TimeManager должен вызывать ошибку если поле delay содержит неверный тип или отсутствует.
    if (typeof descriptor.delay !== 'number') { throw new TypeError('Timer delay must be numeric type!') };

    // TimeManager должен вызывать ошибку если delay меньше 0 и больше 5000.
    if (descriptor.delay < 0 || descriptor.delay > 5000) { throw new RangeError('Timer delay must be in range [0..5000]!') };   

    // TimeManager должен вызывать ошибку если поле interval содержит неверный тип или отсутствует.
    if (typeof descriptor.interval !== 'boolean') { throw new TypeError('Timer interval must be boolean type!') };

    // TimeManager должен вызывать ошибку если поле job содержит неверный тип или отсутствует.
    if (typeof descriptor.job !== 'function') { throw new TypeError('Timer job must be a function!') };

    descriptor.callbackParams = callbackParams; 
    descriptor.timerId = null;
    this.timers.push(descriptor);
   // console.log(this.timers);
    
    return this;    // 2. Вызовы метода add можно соединять manager.add(t1).add(t2, 1, 2);
  }
  
  // 3. Метод remove должен остановить определённый таймер и удалить его из очереди.
  remove(timerName) {
    const idx = this.pause(timerName);
    if (idx >= 0 ) {
      this.timers.splice(idx, 1);
    };
  }

  // 4. Метод start должен запустить все таймеры на выполнение.
  start() {
    if (!this.allStarted) {
      this.timers.forEach((descriptor) => { 
        descriptor.timerId = this._startTimer(descriptor); 
      });
    };  
    this.allStarted = true;
  }

  // 5. Метод stop должен остановить все таймеры.
  stop() {
    if (this.allStarted) {
      this.timers.forEach((descriptor) => { 
        this._stopTimer(descriptor);
        descriptor.timerId = null;
      });
    };
    this.allStarted = false;
  }

  // 6. Метод pause приостанавливает работу конкретного таймера.
  pause(timerName) {
    const idx = this._findTimerIndex(timerName);
    if (idx >= 0) {
      this._stopTimer(this.timers[idx]);
      this.timers[idx].timerId = null;
    };  
    return idx;
  }

  // 7. Метод resume запускает работу конкретного таймера.
  resume(timerName) {
    const idx = this._findTimerIndex(timerName);
    if (idx >= 0) {
      this.timers[idx].timerId = this._startTimer(this.timers[idx]);
    };
    return idx;
  }
}

const manager = new TimersManager();

const t1 = {
  name: 't1',
  delay: 1000,
  interval: true,
  job: () => { console.log('t1') }
};

const t2 = {
  name: 't2',
  delay: 1000,
  interval: false,
  job: (a, b) => a + b
};

const t3 = {
  name: 't3',
  delay: 500,
  interval: true,
  job: () => { console.log('t3') }
};

const t4 = {
  name: 't4',
  delay: 500,
  interval: true,
  job: (a, b) => a + b
};

const t5 = {
  name: 't5',
  delay: 1200,
  interval: false,
  job: () => { throw new Error('We have a problem!') }
 };

manager.add(t1);
manager.add(t2, 1, 2).add(t3).add(t4, 22, 33).add(t5);
manager.start();
manager.pause('t2');
manager.pause('t1');
manager.resume('t2');
manager.remove('t3');
manager.resume('t1');
console.log(manager.timers);

setTimeout(() => console.log(manager.print()), 5000);
