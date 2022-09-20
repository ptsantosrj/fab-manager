import _ from 'lodash';
import { ApiFilter } from '../models/api';

export default class ApiLib {
  static filtersToQuery (filters?: ApiFilter): string {
    if (!filters) return '';

    return '?' + Object.entries(filters)
      .filter(filter => !_.isNil(filter[1]))
      .map(filter => `${filter[0]}=${filter[1]}`)
      .join('&');
  }
}
