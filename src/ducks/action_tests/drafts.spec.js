import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as draftsDuck from '../drafts';
import * as utilsDuck from '../utils';
import { API } from '../../constants/api';
import nock from 'nock';

import { draft, new_draft } from './fixtures';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Actions::Drafts', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('fetches drafts successfully', () => {
    nock(API)
      .get('/drafts/draft-dir')
      .reply(200, [draft]);

    const expectedActions = [
      { type: draftsDuck.FETCH_DRAFTS_REQUEST },
      { type: draftsDuck.FETCH_DRAFTS_SUCCESS, drafts: [draft] },
    ];

    const store = mockStore({ drafts: [], isFetching: false });

    return store.dispatch(draftsDuck.fetchDrafts('draft-dir')).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  it('fetches the draft successfully', () => {
    nock(API)
      .get('/drafts/draft-post.md')
      .reply(200, draft);

    const expectedActions = [
      { type: draftsDuck.FETCH_DRAFT_REQUEST },
      { type: draftsDuck.FETCH_DRAFT_SUCCESS, draft },
    ];

    const store = mockStore({ draft: {}, isFetching: true });

    return store
      .dispatch(draftsDuck.fetchDraft(null, 'draft-post.md'))
      .then(() => {
        expect(store.getActions()).toEqual(expectedActions);
      });
  });

  it('deletes the draft successfully', () => {
    nock(API)
      .delete('/drafts/draft-dir/test.md')
      .reply(200);

    const expectedActions = [
      { type: draftsDuck.DELETE_DRAFT_SUCCESS, id: 'draft-dir/test.md' },
    ];

    const store = mockStore({});

    return store
      .dispatch(draftsDuck.deleteDraft('draft-dir', 'test.md'))
      .then(() => {
        expect(store.getActions()).toEqual(expectedActions);
      });
  });

  it('creates DELETE_DRAFT_FAILURE when deleting a draft failed', () => {
    nock(API)
      .delete('drafts/draft.md')
      .replyWithError('something awful happened');

    const expectedAction = {
      type: draftsDuck.DELETE_DRAFT_FAILURE,
      error: 'something awful happened',
    };

    const store = mockStore({ drafts: [draft] });

    return store.dispatch(draftsDuck.deleteDraft('draft.md')).then(() => {
      expect(store.getActions()[0].type).toEqual(expectedAction.type);
    });
  });

  it('updates the draft successfully', () => {
    nock(API)
      .put('/drafts/draft-post.md')
      .reply(200, draft);

    const expectedActions = [
      { type: utilsDuck.CLEAR_ERRORS },
      { type: draftsDuck.PUT_DRAFT_SUCCESS, draft },
    ];

    const store = mockStore({ metadata: { metadata: draft } });

    return store
      .dispatch(draftsDuck.putDraft('edit', null, 'draft-post.md'))
      .then(() => {
        expect(store.getActions()).toEqual(expectedActions);
      });
  });

  it('creates the draft successfully', () => {
    nock(API)
      .put(`/drafts/${new_draft.relative_path}`)
      .reply(200, new_draft);

    const expectedActions = [
      { type: utilsDuck.CLEAR_ERRORS },
      { type: draftsDuck.PUT_DRAFT_SUCCESS, draft },
    ];

    const store = mockStore({ metadata: { metadata: new_draft } });

    return store.dispatch(draftsDuck.putDraft('create')).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  it('creates the draft with autogenerated filename', () => {
    nock(API)
      .put('/drafts/draft-post.md')
      .reply(200, draft);

    const expectedActions = [
      { type: utilsDuck.CLEAR_ERRORS },
      { type: draftsDuck.PUT_DRAFT_SUCCESS, draft },
    ];

    const store = mockStore({
      metadata: { metadata: { ...new_draft, path: '' } },
    });

    return store.dispatch(draftsDuck.putDraft('create')).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  it('creates PUT_DRAFT_FAILURE when updating draft failed', () => {
    nock(API)
      .put(`/drafts/${draft.relative_path}`)
      .replyWithError('something awful happened');

    const expectedActions = [
      { type: utilsDuck.CLEAR_ERRORS },
      { type: draftsDuck.PUT_DRAFT_FAILURE, error: 'something awful happened' },
    ];

    const store = mockStore({ metadata: { metadata: draft } });

    return store.dispatch(draftsDuck.putDraft('edit')).then(() => {
      expect(store.getActions()[1].type).toEqual(expectedActions[1].type);
    });
  });

  it('creates VALIDATION_ERROR if required fields are not provided.', () => {
    const expectedActions = [
      {
        type: utilsDuck.VALIDATION_ERROR,
        errors: ['The title is required.', 'The filename is not valid.'],
      },
    ];

    const store = mockStore({
      metadata: { metadata: { path: '', title: '' } },
    });

    store.dispatch(draftsDuck.putDraft('create'));
    expect(store.getActions()).toEqual(expectedActions);
  });
});
