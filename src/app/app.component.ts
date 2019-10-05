import {Component, OnDestroy} from '@angular/core';
import {TerminalService} from 'primeng/components/terminal/terminalservice';
import {Subscription} from 'rxjs';
import {ajax} from 'rxjs/ajax';
import {Message, MessageService} from 'primeng/api';
import {Dal} from 'cdp4-sdkts/lib/dal/dal';
import {Session} from 'cdp4-sdkts/lib/dal/session';
import {CdpServicesDal} from 'cdp4-sdkts/lib/dal/cdp-services-dal';
import {UserSessionService} from 'cdp4-sdkts/lib/dal/user-session.service';
import {ThingUpdateService} from 'cdp4-sdkts/lib/dal/thing-update.service';
import {ThingUpdateEvent, UpdateKind} from 'cdp4-sdkts/lib/dal/thing-update.event';
import {Dto} from 'cdp4-sdkts/lib/dto/autogen/dto.generated';
import {GuidHelper} from 'cdp4-sdkts/lib/utils/guid.helper';
import {Metadata} from 'cdp4-sdkts/lib/dto/autogen/metadata/thing.metadata.generated';
import {TransactionContextResolver} from 'cdp4-sdkts/lib/dal/transaction-context.resolver';
import {ThingTransaction} from 'cdp4-sdkts/lib/dal/thing-transaction';
import {Cdp4Type} from 'cdp4-sdkts/lib/types/ordered-item';
import EngineeringModelSetup = Dto.EngineeringModelSetup;
import IterationSetup = Dto.IterationSetup;
import DomainOfExpertise = Dto.DomainOfExpertise;
import VcardEmailAddressKind = Dto.VcardEmailAddressKind;
import Iteration = Dto.Iteration;
import ElementDefinition = Dto.ElementDefinition;
import Parameter = Dto.Parameter;
import ParameterType = Dto.ParameterType;
import PossibleFiniteState = Dto.PossibleFiniteState;
import PossibleFiniteStateList = Dto.PossibleFiniteStateList;
import OrderedItem = Cdp4Type.OrderedItem;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [TerminalService, MessageService]
})
export class AppComponent implements OnDestroy {
  title = 'cdp4-sdkts-samples';

  subscription: Subscription;

  // Commands
  private readonly OPEN: string = 'open';
  private readonly REFRESH: string = 'refresh';
  private readonly RELOAD: string = 'reload';
  private readonly CLOSE: string = 'close';
  private readonly RESTORE: string = 'restore';
  private readonly GET_ITERATION: string = 'get_iteration';
  private readonly POST_PERSON: string = 'post_person';
  private readonly POST_PARAMETER: string = 'post_parameter';
  private readonly POST_PFSL: string = 'post_pfsl';
  private readonly POST_PFSL_REORDER: string = 'post_pfsl_reorder';
  private readonly REMOVE_PARAMETER: string = 'remove_parameter';

  public username: string;
  public password: string;
  public isLoggedIn = false;
  msgs: Message[] = [];

  private dal: Dal;
  private session: Session;
  private thingUpdateService: ThingUpdateService;
  private log = '';

  constructor(private terminalService: TerminalService, private messageService: MessageService) {
    this.subscription = this.terminalService.commandHandler.subscribe(command => this.processCommand(command));
    this.dal = new CdpServicesDal('1.1.0');
    this.thingUpdateService = new ThingUpdateService();
    this.session = new UserSessionService(this.dal, this.thingUpdateService);
    this.thingUpdateService.thingUpdated$.subscribe(x => this.formLogMessage(x));
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private login(event: Event) {
    // TODO Validate inputs

    ajax({
      url: '/login',
      method: 'GET',
      headers: {
        'Accept-CDP': '1.1.0',
        Authorization: 'Basic ' + window.btoa(this.username + ':' + this.password)
      }
    }).subscribe(x => {
        this.password = '';
        this.isLoggedIn = true;
        this.msgs = [];
        this.msgs.push({severity: 'success', summary: 'Success!', detail: 'You have been logged in'});
      },
      error => {
        this.msgs = [];
        this.msgs.push({
          severity: 'error',
          summary: 'Error!',
          detail: `Unable to login. Server responded with status ${error.status} and message ${error.response}`
        });
        this.isLoggedIn = false;
      });
  }

  private logout(event?: Event) {
    ajax({
      url: '/logout',
      method: 'GET'
    }).subscribe(x => {
      this.isLoggedIn = false;
      this.msgs = [];
      window.location.replace('/');
    });
  }

  private processCommand(command: string) {
    switch (command) {
      case this.OPEN: {
        this.open();
        break;
      }
      case this.REFRESH: {
        this.refresh();
        break;
      }
      case this.RELOAD: {
        this.reload();
        break;
      }
      case this.GET_ITERATION: {
        this.getIteration();
        break;
      }
      case this.POST_PERSON: {
        this.postPerson();
        break;
      }
      case this.POST_PARAMETER: {
        this.postParameter();
        break;
      }
      case this.POST_PFSL: {
        this.postPossibleFiniteStateList();
        break;
      }
      case this.POST_PFSL_REORDER: {
        this.postPossibleFiniteStateListReorder();
        break;
      }
      case this.REMOVE_PARAMETER: {
        this.removeParameter();
        break;
      }
      case this.CLOSE: {
        this.close();
        break;
      }
      case this.RESTORE: {
        this.restore();
        break;
      }
      default: {
        this.terminalService.sendResponse('Unrecognized command. Please take a look at the available commands at the top.');
      }
    }
  }

  private open() {
    this.session.open().subscribe(x => this.printLog(' | Opened: ' + x));
  }

  private refresh() {
    this.session.refresh();
    setTimeout(() => {
      this.printLog(' Refreshed');
    }, 1000);
  }

  private reload() {
    setTimeout(() => {
      this.printLog(' Reloaded');
    }, 1000);
  }

  private getIteration() {
    const siteDirectory = this.session.retrieveSiteDirectory();
    if (siteDirectory == null) {
      this.printLog('Connection is not opened');
      return;
    }

    const engineeringModelSetupId = siteDirectory.model[0];
    const engineeringModelSetup = this.session.get<EngineeringModelSetup>(Dto.ClassKind[Dto.ClassKind.EngineeringModelSetup],
      engineeringModelSetupId, null);
    const iterationSetupId = engineeringModelSetup.iterationSetup[0];
    const iterationSetup = this.session.get<IterationSetup>(Dto.ClassKind[Dto.ClassKind.IterationSetup], iterationSetupId, null);
    const domainOfExpertiseId = engineeringModelSetup.activeDomain[0];
    const domainOfExpertise = this.session.get<DomainOfExpertise>(Dto.ClassKind[Dto.ClassKind.DomainOfExpertise],
      domainOfExpertiseId, null);
    this.session.readIteration(iterationSetup, domainOfExpertise).subscribe(x => this.printLog(' | Iteration is retrieved: ' + x));
  }

  private postPerson() {
    if (this.session.retrieveSiteDirectory() == null) {
      this.printLog('At first a connection should be opened.');
      return;
    }

    const siteDirectory = this.session.retrieveSiteDirectory();
    const context = TransactionContextResolver.getSiteDirectoryContext(siteDirectory.iid);
    const containerClone = Metadata.getMetadata(Dto.ClassKind[siteDirectory.classKind]).clone(siteDirectory, null) as Dto.SiteDirectory;

    const transaction = new ThingTransaction(context);

    transaction.update(containerClone, siteDirectory);

    // Create person object
    const person = new Dto.Person(GuidHelper.generateGuid(), 0, false);
    person.isActive = true;
    person.shortName = 'M' + Date.now().toString();
    person.surname = 'Mouse';
    person.container = containerClone;

    const email1 = new Dto.EmailAddress(GuidHelper.generateGuid(), 0, false);
    email1.value = 'mikki.home@mouse.com';
    email1.vcardType = VcardEmailAddressKind.HOME;
    email1.container = person;

    person.defaultEmailAddress = email1.iid;
    person.givenName = 'Mike';
    person.password = 'password';

    const email2 = new Dto.EmailAddress(GuidHelper.generateGuid(), 0, false);
    email2.value = 'mikki.work@mouse.com';
    email2.vcardType = VcardEmailAddressKind.WORK;
    email2.container = person;

    person.emailAddress.push(email1.iid, email2.iid);
    containerClone.person.push(person.iid);
    transaction.update(containerClone, siteDirectory);
    transaction.create(person);
    transaction.create(email1);
    transaction.create(email2);

    this.session.write(transaction.finalizeTransaction()).subscribe(
      x => this.printLog('A person is posted: ' + x),
      error => this.printLog('During post operation an error is received: ' + error)
    );
  }

  private postParameter() {
    let iterationId = null;

    for (const key in this.session.openIterations) {
      if (this.session.openIterations.hasOwnProperty(key)) {
        iterationId = key;
      }
    }

    if (iterationId == null) {
      this.printLog('At first a connection should be opened and iteration is retrieved.');
      return;
    }

    const iteration = this.session.get<Iteration>(Dto.ClassKind[Dto.ClassKind.Iteration], iterationId, null);
    const context = TransactionContextResolver.getIterationContext(iteration.container.iid, iteration.iid);
    const elementDefinitionId = iteration.element[0];
    const elementDefinition = this.session.get<ElementDefinition>(Dto.ClassKind[Dto.ClassKind.ElementDefinition],
      elementDefinitionId, iterationId);
    const elementDefinitionClone = Metadata.getMetadata(Dto.ClassKind[elementDefinition.classKind]).clone(elementDefinition,
      iteration) as Dto.ElementDefinition;
    const domainOfExpertise = this.session.openIterations[iterationId][0];

    const parameter = new Parameter(GuidHelper.generateGuid(), 0, false);
    parameter.container = elementDefinitionClone;
    elementDefinitionClone.parameter.push(parameter.iid);
    parameter.owner = domainOfExpertise.iid;
    parameter.parameterType = this.session.retrieve<ParameterType>(Dto.ClassKind.ParameterType, iteration.iid)[0].iid;

    const transaction = new ThingTransaction(context);
    transaction.update(elementDefinitionClone, elementDefinition);
    transaction.create(parameter);

    this.session.write(transaction.finalizeTransaction()).subscribe(
      x => this.printLog('A parameter is posted: ' + x),
      error => this.printLog('During post operation an error is received: ' + error)
    );
  }

  private postPossibleFiniteStateList() {
    let iterationId = null;

    for (const key in this.session.openIterations) {
      if (this.session.openIterations.hasOwnProperty(key)) {
        iterationId = key;
      }
    }

    if (iterationId == null) {
      this.printLog('At first a connection should be opened and iteration is retrieved.');
      return;
    }

    const iteration = this.session.get<Iteration>(Dto.ClassKind[Dto.ClassKind.Iteration], iterationId, null);
    const iterationClone = Metadata.getMetadata(Dto.ClassKind[iteration.classKind]).clone(iteration,
      iteration.container) as Dto.Iteration;
    const context = TransactionContextResolver.getIterationContext(iteration.container.iid, iteration.iid);
    const domainOfExpertise = this.session.openIterations[iterationId][0];

    const pfs1 = new PossibleFiniteState(GuidHelper.generateGuid(), 0, false);
    pfs1.name = 'state1';
    pfs1.shortName = 's1';

    const pfs2 = new PossibleFiniteState(GuidHelper.generateGuid(), 0, false);
    pfs2.name = 'state2';
    pfs2.shortName = 's2';

    const pfsList = new PossibleFiniteStateList(GuidHelper.generateGuid(), 0, false);
    pfsList.name = 'PossibleFiniteStateList1';
    pfsList.shortName = 'PFSL1';

    pfs1.container = pfsList;
    pfs2.container = pfsList;
    pfsList.container = iterationClone;
    pfsList.owner = domainOfExpertise.iid;

    const oi1 = new OrderedItem();
    oi1.k = 1;
    oi1.v = pfs1.iid;

    const oi2 = new OrderedItem();
    oi2.k = 2;
    oi2.v = pfs2.iid;

    pfsList.possibleState.push(oi1, oi2);
    iterationClone.possibleFiniteStateList.push(pfsList.iid);

    const transaction = new ThingTransaction(context);
    transaction.update(iterationClone, iteration);
    transaction.create(pfsList);
    transaction.create(pfs1);
    transaction.create(pfs2);

    this.session.write(transaction.finalizeTransaction()).subscribe(
      x => this.printLog('A possibleFiniteStateList is posted: ' + x),
      error => this.printLog('During post operation an error is received: ' + error)
    );
  }

  private postPossibleFiniteStateListReorder() {
    let iterationId = null;

    for (const key in this.session.openIterations) {
      if (this.session.openIterations.hasOwnProperty(key)) {
        iterationId = key;
      }
    }

    if (iterationId == null) {
      this.printLog('At first a connection should be opened and iteration is retrieved.');
      return;
    }

    const iteration = this.session.get<Iteration>(Dto.ClassKind[Dto.ClassKind.Iteration], iterationId, null);
    const pfslArray = this.session.retrieve<PossibleFiniteStateList>(Dto.ClassKind.PossibleFiniteStateList, iteration.iid);

    if (pfslArray.length === 0) {
      this.printLog('There is not a predefined PossibleFiniteStateList. Execute post_pfsl');
      return;
    }

    const pfsl = pfslArray[1];
    const pfslClone = Metadata.getMetadata(Dto.ClassKind[pfsl.classKind]).clone(pfsl,
      iteration) as Dto.PossibleFiniteStateList;

    const orderedItems: OrderedItem [] = [];
    for (const oi of pfsl.possibleState) {
      const oi1 = new OrderedItem();
      oi1.k = oi.k;
      oi1.v = oi.v;
      orderedItems.push(oi1);
    }

    pfslClone.container = iteration;
    pfslClone.possibleState = orderedItems;
    pfslClone.modifiedOn = new Date(Date.now()).toISOString();
    const tmp = orderedItems[0].k;
    orderedItems[0].k = orderedItems[1].k;
    orderedItems[1].k = tmp;

    const context = TransactionContextResolver.getIterationContext(iteration.container.iid, iteration.iid);
    const transaction = new ThingTransaction(context);
    transaction.update(pfslClone, pfsl);

    this.session.write(transaction.finalizeTransaction()).subscribe(
      x => this.printLog('A possibleFiniteStateList items are reordered: ' + x),
      error => this.printLog('During post operation an error is received: ' + error)
    );
  }

  private removeParameter() {
    let iterationId = null;

    for (const key in this.session.openIterations) {
      if (this.session.openIterations.hasOwnProperty(key)) {
        iterationId = key;
      }
    }

    if (iterationId == null) {
      this.printLog('At first a connection should be opened and iteration is retrieved.');
      return;
    }

    const iteration = this.session.get<Iteration>(Dto.ClassKind[Dto.ClassKind.Iteration], iterationId, null);
    const context = TransactionContextResolver.getIterationContext(iteration.container.iid, iteration.iid);
    const elementDefinitionId = iteration.element[0];
    const elementDefinition = this.session.get<ElementDefinition>(Dto.ClassKind[Dto.ClassKind.ElementDefinition],
      elementDefinitionId, iterationId);
    const parameterId = elementDefinition.parameter[0];
    const parameter = this.session.get<Parameter>(Dto.ClassKind[Dto.ClassKind.Parameter],
      parameterId, iterationId);
    const parameterClone = Metadata.getMetadata(Dto.ClassKind[parameter.classKind]).clone(parameter,
      elementDefinition) as Dto.Parameter;

    const transaction = new ThingTransaction(context);
    transaction.delete(parameterClone);

    this.session.write(transaction.finalizeTransaction()).subscribe(
      x => this.printLog('A parameter is deleted: ' + x),
      error => this.printLog('During post operation an error is received: ' + error)
    );
  }

  private close() {
    if (this.session.retrieveSiteDirectory() == null) {
      this.printLog('At first a connection should be opened.');
      return;
    }
    this.session.close().subscribe(
      x => this.logout(),
      error => this.printLog('During close operation an error is received: ' + error)
    );
  }

  private restore() {
    if (this.session.retrieveSiteDirectory() != null) {
      this.printLog('It is possible to restore the server only before connection is opened.');
      return;
    }

    ajax({
      url: '/Data/Restore',
      method: 'POST'
    }).subscribe(x => {
        this.msgs = [];
        this.msgs.push({severity: 'success', summary: 'Success!', detail: 'Database is restored'});
      },
      error => {
        this.msgs = [];
        this.msgs.push({
          severity: 'error',
          summary: 'Error!',
          detail: `Unable to restore the database. Server responded with status ${error.status} and message ${error.response}`
        });
      });
  }

  private printLog(msg?: string) {
    this.terminalService.sendResponse(this.log + msg);
    this.log = '';
  }

  private formLogMessage(event: ThingUpdateEvent) {
    this.log = this.log + ` | ${UpdateKind[event.eventKind]} - ${Dto.ClassKind[event.thing.classKind]}: ${event.thing.iid}`;
  }
}
